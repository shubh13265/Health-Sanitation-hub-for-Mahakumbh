import React, { useRef } from "react";

type Props = {
  text: string;
  className?: string;
};

export default function FloatingQuote({ text, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onEnter = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1.08)";
  };
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const px = (x / rect.width) * 2 - 1; const py = (y / rect.height) * 2 - 1;
    const rx = (-py) * 8; const ry = (px) * 12;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.08)`;
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={("relative rounded-xl border bg-black p-4 shadow-md ring-1 ring-primary/10 transition-transform will-change-transform " + (className||""))}
      style={{ transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)", transition: "transform 200ms ease" }}
    >
      <p className="text-xl md:text-2xl font-semibold italic bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-teal-300 to-violet-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.25)]">
        {text}
      </p>
    </div>
  );
}
