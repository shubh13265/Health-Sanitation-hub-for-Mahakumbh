import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import { useRef } from "react";

function Rotator(props: any) {
  const ref = useRef<any>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = t * 0.2;
    ref.current.rotation.y = t * 0.3;
  });
  return (
    <mesh ref={ref} {...props} castShadow receiveShadow>
      <torusKnotGeometry args={[1.2, 0.35, 200, 32]} />
      <meshStandardMaterial color="#6c3bff" metalness={0.6} roughness={0.2} />
    </mesh>
  );
}

export default function LandingScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} shadows>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
          <Rotator position={[0, 0, 0]} />
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
