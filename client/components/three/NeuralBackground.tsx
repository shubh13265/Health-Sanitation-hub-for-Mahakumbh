import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type LayerProps = {
  count: number;
  radius: number;
  linkDist: number;
  maxSegments: number;
  speed: number;
  pointSize: number;
  pointColor: string;
  lineColor: string;
  opacity?: number;
};

function NeuronLayer({ count, radius, linkDist, maxSegments, speed, pointSize, pointColor, lineColor, opacity = 0.75 }: LayerProps) {
  const COUNT = count;
  const RADIUS = radius;
  const LINK_DIST = linkDist;
  const MAX_SEGMENTS = maxSegments;

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      pos[i3 + 0] = (Math.random() * 2 - 1) * RADIUS;
      pos[i3 + 1] = (Math.random() * 2 - 1) * (RADIUS * 0.6);
      pos[i3 + 2] = (Math.random() * 2 - 1) * RADIUS;
    }
    return pos;
  }, [COUNT, RADIUS]);

  const velocities = useMemo(() => {
    const v = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      v[i3 + 0] = (Math.random() * speed - speed / 2);
      v[i3 + 1] = (Math.random() * speed - speed / 2);
      v[i3 + 2] = (Math.random() * speed - speed / 2);
    }
    return v;
  }, [COUNT, speed]);

  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  const linePositions = useMemo(() => new Float32Array(MAX_SEGMENTS * 6), [MAX_SEGMENTS]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const phases = useMemo(() => {
    const p = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) p[i] = Math.random() * Math.PI * 2;
    return p;
  }, [COUNT]);

  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    g.setDrawRange(0, 0);
    return g;
  }, [linePositions]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      // random drift
      for (let a = 0; a < 3; a++) {
        pos.array[i3 + a] += velocities[i3 + a];
      }
      // floating upward + gentle wobble
      pos.array[i3 + 1] += speed * 0.25;
      pos.array[i3 + 0] += Math.sin(t * 0.5 + phases[i]) * (speed * 0.5);
      pos.array[i3 + 2] += Math.cos(t * 0.4 + phases[i]) * (speed * 0.5);
      // wrap vertically and bounce X/Z
      if (pos.array[i3 + 1] > RADIUS) pos.array[i3 + 1] = -RADIUS;
      if (pos.array[i3 + 0] > RADIUS || pos.array[i3 + 0] < -RADIUS) velocities[i3 + 0] *= -1;
      if (pos.array[i3 + 2] > RADIUS || pos.array[i3 + 2] < -RADIUS) velocities[i3 + 2] *= -1;
    }
    pos.needsUpdate = true;

    let segs = 0;
    for (let i = 0; i < COUNT; i++) {
      const ax = pos.array[i * 3 + 0];
      const ay = pos.array[i * 3 + 1];
      const az = pos.array[i * 3 + 2];
      for (let j = i + 1; j < COUNT; j++) {
        const bx = pos.array[j * 3 + 0];
        const by = pos.array[j * 3 + 1];
        const bz = pos.array[j * 3 + 2];
        const dx = ax - bx, dy = ay - by, dz = az - bz;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < LINK_DIST * LINK_DIST) {
          const k = segs * 6;
          if (k + 5 >= linePositions.length) break;
          linePositions[k + 0] = ax; linePositions[k + 1] = ay; linePositions[k + 2] = az;
          linePositions[k + 3] = bx; linePositions[k + 4] = by; linePositions[k + 5] = bz;
          segs++;
        }
      }
    }
    const lg = linesRef.current.geometry as THREE.BufferGeometry;
    const attr = lg.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
    lg.setDrawRange(0, segs * 2);
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial color={new THREE.Color(pointColor)} size={pointSize} sizeAttenuation transparent opacity={opacity} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeom}>
        <lineBasicMaterial color={new THREE.Color(lineColor)} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}

function Parallax() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 0.8;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 0.8;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  useFrame(() => {
    camera.position.x += (target.current.x - camera.position.x) * 0.05;
    camera.position.y += (-target.current.y - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function NeuralBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-[#081226] via-[#0b1f4d] to-[#081226]" />
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <color attach="background" args={["transparent"]} />
        <fog attach="fog" args={["#0b1020", 10, 26]} />
        <ambientLight intensity={0.5} />
        <Parallax />
        {/* Back layer (wide, faint) */}
        <NeuronLayer count={300} radius={12} linkDist={6.6} maxSegments={9000} speed={0.005} pointSize={0.07} pointColor="#6197ff" lineColor="#7aa9ff" opacity={0.55} />
        {/* Front layer (dense, bright) */}
        <NeuronLayer count={200} radius={8.5} linkDist={5.1} maxSegments={6000} speed={0.007} pointSize={0.11} pointColor="#8fc2ff" lineColor="#b6d6ff" opacity={0.9} />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(60,100,200,0.15),rgba(20,40,100,0.6))]" />
    </div>
  );
}
