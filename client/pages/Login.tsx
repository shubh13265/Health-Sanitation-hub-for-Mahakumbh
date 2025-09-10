import { Link } from "react-router-dom";
import { Shield, User2, Wrench } from "lucide-react";

export default function Login() {
  return (
    <div className="relative mx-auto max-w-5xl min-h-screen grid place-items-center py-8">
      <div className="animated-grid relative overflow-hidden rounded-3xl border bg-card/70 p-8 shadow-xl backdrop-blur transform-gpu transition-transform duration-300 hover:scale-[1.02] hover:[transform:rotateX(2deg)_rotateY(-2deg)] min-h-[85vh] flex flex-col justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-center bg-cover opacity-40"
          style={{ backgroundImage: 'url("https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2F21a6d9ebb6c747f7bf95bcd8cc5ff748?format=webp&width=1600")' }}
        />
        <div className="relative text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">Welcome to Smart Health & Sanitation Hub</h1>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <Link to="/user/login" className="rounded-2xl border bg-background/70 p-4 shadow-sm hover:bg-muted transition-colors transition-transform hover:scale-[1.2] cursor-pointer min-h-[140px] flex flex-col justify-between">
            <div className="flex items-center gap-2 text-base font-semibold uppercase"><User2 className="h-5 w-5 text-primary" /> User</div>
            <div className="mt-2 text-xs text-muted-foreground">Pilgrim features: voice bot, quick actions, rewards.</div>
          </Link>
          <Link to="/worker/login" className="rounded-2xl border bg-background/70 p-4 shadow-sm hover:bg-muted transition-colors transition-transform hover:scale-[1.2] cursor-pointer min-h-[140px] flex flex-col justify-between">
            <div className="flex items-center gap-2 text-base font-semibold uppercase"><Wrench className="h-5 w-5 text-secondary" /> Worker</div>
            <div className="mt-2 text-xs text-muted-foreground">Task inbox, SLA timers, navigation, chat.</div>
          </Link>
          <Link to="/admin/login" className="rounded-2xl border bg-background/70 p-4 shadow-sm hover:bg-muted transition-colors transition-transform hover:scale-[1.2] cursor-pointer min-h-[140px] flex flex-col justify-between">
            <div className="flex items-center gap-2 text-base font-semibold uppercase"><Shield className="h-5 w-5 text-accent" /> Admin</div>
            <div className="mt-2 text-xs text-muted-foreground">Digital twin, workflow monitoring, recommendations.</div>
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
