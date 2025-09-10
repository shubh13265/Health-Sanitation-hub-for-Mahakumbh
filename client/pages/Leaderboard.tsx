import { Link, useNavigate } from "react-router-dom";
import { Trophy, LogOut } from "lucide-react";

export default function Leaderboard() {
  const nav = useNavigate();
  const name = localStorage.getItem("user_name");
  const score = Number(localStorage.getItem("hygiene_score") || 0);

  if (!name) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-lg font-semibold">Leaderboard</div>
        <p className="mt-2 text-sm text-muted-foreground">Please log in as a user to view your score.</p>
        <div className="mt-4">
          <Link to="/user/login" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Login as User</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] pb-12">
      <div className="group relative overflow-hidden mx-auto max-w-md rounded-2xl border bg-card p-6 shadow-sm transition-transform hover:scale-[1.1] hover:shadow-lg">
        <Trophy className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 text-accent/40 opacity-50 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-lg font-semibold"><Trophy className="h-5 w-5 text-accent" /> Leaderboard</div>
          <button
            onClick={() => { localStorage.removeItem('user_name'); localStorage.removeItem('worker_auth'); localStorage.removeItem('admin_auth'); nav('/', { replace: true }); }}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted transition-transform hover:scale-110"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
        <div className="mt-4 rounded-lg border p-4 bg-background/60">
          <div className="flex items-center justify-between">
            <div className="font-medium">{name}</div>
            <div className="text-2xl font-bold">{score}</div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Scores shown for the logged-in user only.</div>
        </div>
      </div>
    </div>
  );
}
