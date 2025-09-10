import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserLogin() {
  const nav = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    const n = localStorage.getItem("user_name");
    if (n) nav("/", { replace: true });
  }, [nav]);

  const save = () => {
    if (!name.trim()) return;
    localStorage.setItem("user_name", name.trim());
    nav("/", { replace: true });
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">User Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your name to personalize your experience.</p>
        <input className="mt-4 w-full rounded-md border px-3 py-2 shadow-sm" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-4 flex justify-end">
          <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Continue</button>
        </div>
      </div>
    </div>
  );
}
