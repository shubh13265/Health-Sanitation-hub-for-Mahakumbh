import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuth, setAdminAuth } from "@/lib/adminStore";

export default function AdminLogin() {
  const nav = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const a = getAdminAuth();
    if (a) nav("/admin/dashboard", { replace: true });
  }, [nav]);

  const login = () => {
    if (!adminId) return;
    setAdminAuth({ adminId, name: `Admin ${adminId}` });
    nav("/admin/dashboard", { replace: true });
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your Admin ID and password.</p>
        <label className="mt-4 block text-sm">Admin ID</label>
        <input className="w-full rounded-md border px-3 py-2 shadow-sm" value={adminId} onChange={(e) => setAdminId(e.target.value)} />
        <label className="mt-3 block text-sm">Password</label>
        <input type="password" className="w-full rounded-md border px-3 py-2 shadow-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="mt-4 flex justify-end">
          <button onClick={login} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Login</button>
        </div>
      </div>
    </div>
  );
}
