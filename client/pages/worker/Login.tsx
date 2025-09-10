import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, setAuth, resetTasksForNewLogin } from "@/lib/workerStore";
import { LogIn } from "lucide-react";

export default function WorkerLogin() {
  const nav = useNavigate();
  const [workerId, setWorkerId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const auth = getAuth();
    if (auth) nav("/worker", { replace: true });
  }, [nav]);

  const login = () => {
    if (!workerId) return;
    // no real backend; accept any password for demo
    setAuth({ workerId, name: `Worker ${workerId}` });
    resetTasksForNewLogin(Date.now());
    nav("/worker", { replace: true });
  };


  return (
    <div className="relative min-h-[80vh] grid place-items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-center bg-cover opacity-20"
        style={{ backgroundImage: 'url("https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2F24d683562df84a55ae6de97d768ec531?format=webp&width=800")' }}
      />
      <div className="relative mx-auto max-w-sm z-10">
      <div className="rounded-2xl border bg-card p-6 shadow-sm transition-transform hover:scale-[1.1] hover:shadow-lg">
        <h1 className="text-2xl font-bold">Worker Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your Worker ID and password.</p>
        <div className="mt-6 grid gap-3">
          <label className="text-sm">Worker ID</label>
          <input value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="w-full rounded-md border px-3 py-2 shadow-sm" placeholder="e.g. W123" />
          <label className="text-sm">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border px-3 py-2 shadow-sm" placeholder="••••••" />
          <div className="flex items-center justify-end mt-2">
            <button onClick={login} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground shadow hover:opacity-90 transition-transform hover:scale-110">
              <LogIn className="h-4 w-4" /> Login
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
