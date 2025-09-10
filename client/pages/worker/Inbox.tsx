import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, openInMaps, priorityMeta, readTasks, sortTasks, syncOutbox } from "@/lib/workerStore";
import { MapPin, Clock, Siren, LogOut } from "lucide-react";

function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
}

export default function WorkerInbox() {
  const nav = useNavigate();
  const auth = getAuth();
  const [tick, setTick] = useState(0);
  const [tasks, setTasks] = useState(readTasks());

  useEffect(() => {
    if (!auth) nav("/worker/login", { replace: true });
  }, [auth, nav]);

  useEffect(() => {
    setTasks(readTasks());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === 'worker_tasks') setTasks(readTasks()); };
    window.addEventListener('storage', onStorage);
    const id = setInterval(() => setTasks(readTasks()), 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(id); };
  }, []);

  useInterval(() => setTick((t) => t + 1), 1000);

  useEffect(() => {
    const onOnline = () => syncOutbox();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const sorted = useMemo(() => {
    const system = tasks.filter(t => t.source !== 'user').slice().sort(sortTasks);
    const user = tasks.filter(t => t.source === 'user').slice().sort((a,b)=>a.createdAt-b.createdAt);
    return [...system, ...user];
  }, [tasks, tick]);

  const logout = () => {
    localStorage.removeItem("worker_auth");
    nav("/worker/login", { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Signed in as</div>
          <div className="font-semibold">{auth?.name}</div>
        </div>
        <button onClick={logout} className="rounded-md border px-3 py-2 text-sm flex items-center gap-2"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
      <div className="grid gap-3">
        {sorted.map((t) => {
          const meta = priorityMeta(t.priority);
          const remaining = Math.max(0, t.slaDueAt - Date.now());
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          const urgent = remaining <= 5 * 60 * 1000 || t.priority === "high";
          const red = t.source === 'user';
          const assignedToYou = auth?.workerId && t.assignedTo === auth.workerId;
          return (
            <button key={t.id} onClick={() => nav(`/worker/task/${t.id}`)} className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-transform hover:scale-[1.1] hover:shadow-lg hover:bg-muted cursor-pointer ${red ? 'border-red-500' : meta.border}`}>
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-2">
                  {t.title}
                  {red && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">HELP</span>}
                  {assignedToYou && <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">ASSIGNED</span>}
                </div>
                <div className={`rounded-full px-2 py-0.5 text-xs ${meta.color}`}>{meta.label}</div>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> {mins}m {secs}s left</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />
                  <a onClick={(e) => { e.stopPropagation(); openInMaps(t.location.lat, t.location.lng); }} className="underline cursor-pointer">{t.location.name}</a>
                </div>
              </div>
              {urgent && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-600"><Siren className="h-4 w-4" /> SLA is urgent</div>
              )}
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">No tasks in inbox.</div>
        )}
      </div>
    </div>
  );
}
