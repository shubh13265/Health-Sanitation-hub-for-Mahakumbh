import React, { useRef } from "react";

type Props = {
  src: string;
  alt: string;
  title?: string;
  className?: string;
};

export default function TiltCard({ src, alt, title, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onEnter = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1.1)";
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 2 - 1; // -1..1
    const py = (y / rect.height) * 2 - 1;
    const rx = (-py) * 10; // rotateX deg
    const ry = (px) * 14; // rotateY deg
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.1)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div
      className={"group relative select-none" + (className ? ` ${className}` : "")}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)", transition: "transform 200ms ease" }}
      ref={ref}
    >
      <div className="overflow-hidden rounded-2xl border shadow-lg">
        <img src={src} alt={alt} className="h-40 w-full object-cover will-change-transform transition-transform duration-200 ease-out" />
      </div>
      {title && (
        <div className="mt-2 text-center text-sm font-medium text-foreground/90">{title}</div>
      )}
    </div>
  );
}
