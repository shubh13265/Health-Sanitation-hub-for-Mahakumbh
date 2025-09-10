import { Link, useLocation, useInRouterContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideActivitySquare, LucideMic, LucideScan, LucideShieldCheck, ArrowLeft } from "lucide-react";
import NeuralBackground from "@/components/three/NeuralBackground";

const NavLinkInner = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  const cls = cn(
    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
    active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-muted",
  );
  return <Link to={to} className={cls}>{label}</Link>;
};

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const inRouter = useInRouterContext();
  if (!inRouter) {
    const active = (typeof window !== 'undefined' ? window.location.pathname : '') === to;
    const cls = cn(
      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
      active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-muted",
    );
    return <a href={to} className={cls}>{label}</a>;
  }
  return <NavLinkInner to={to} label={label} />;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-transparent">
      <NeuralBackground />
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2F51d7a0eb2d31442a9aec542041841fbb?format=webp&width=1600"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover opacity-10"
      />
      <header className="backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b border-border/50 bg-background/70">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (typeof window !== 'undefined') { if (window.history.length > 1) window.history.back(); else window.location.href = '/'; } }}
              className="rounded-md p-2 hover:bg-muted transition-transform hover:scale-110"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {useInRouterContext() ? (
              <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                <LucideShieldCheck className="h-6 w-6 text-primary" />
                <span>Smart Health & Sanitation Hub — Ujjain 2028</span>
              </Link>
            ) : (
              <a href="/" className="flex items-center gap-2 font-bold text-lg">
                <LucideShieldCheck className="h-6 w-6 text-primary" />
                <span>Smart Health & Sanitation Hub — Ujjain 2028</span>
              </a>
            )}
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {typeof window !== 'undefined' && (localStorage.getItem('user_name') || localStorage.getItem('worker_auth') || localStorage.getItem('admin_auth')) ? (
              <>
                <NavLink to="/home" label="Pilgrim" />
                <NavLink to="/worker" label="Worker" />
                <NavLink to="/admin" label="Admin" />
                <NavLink to="/risk-scanner" label="Risk Scanner" />
                <NavLink to="/leaderboard" label="Leaderboard" />
              </>
            ) : (
              <NavLink to="/" label="Login" />
            )}
          </nav>
        </div>
      </header>
      <main className="container py-6 md:py-10">{children}</main>
      <footer className="border-t border-border/50 bg-background/70">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 py-6 text-sm text-foreground/70">
          <div className="flex items-center gap-2">
            <LucideMic className="h-4 w-4" />
            <span>Multilingual Voice • Offline-first PWA</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><LucideActivitySquare className="h-4 w-4" /><span>AI Digital Twin</span></div>
            <div className="flex items-center gap-2"><LucideScan className="h-4 w-4" /><span>Photo Risk Scanner</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
