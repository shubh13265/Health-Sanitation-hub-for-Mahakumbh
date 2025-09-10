import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, readTasks, readOutbox } from "@/lib/workerStore";
import { Award, Timer } from "lucide-react";

function badgeFor(count: number) {
  if (count >= 15) return { name: "Gold Worker", color: "bg-yellow-400 text-black" };
  if (count >= 7) return { name: "Silver Worker", color: "bg-gray-300 text-black" };
  return { name: "Bronze Worker", color: "bg-amber-700 text-white" };
}

export default function WorkerProfile() {
  const nav = useNavigate();
  const auth = getAuth();
  const [tasks, setTasks] = useState(readTasks());

  useEffect(() => {
    if (!auth) nav("/worker/login", { replace: true });
  }, [auth, nav]);

  useEffect(() => {
    setTasks(readTasks());
  }, []);

  const completedToday = useMemo(() => {
    const out = readOutbox();
    const start = new Date();
    start.setHours(0,0,0,0);
    return out.filter((o) => o.type === "status_update" && o.payload?.status === "completed" && o.queuedAt >= start.getTime()).length;
  }, []);
  const avgSLA = useMemo(() => 18, []); // minutes example
  const badge = badgeFor(completedToday);

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-sm text-muted-foreground">Worker</div>
        <div className="text-2xl font-bold">{auth?.name}</div>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Tasks Completed Today</div>
            <div className="text-3xl font-bold">{completedToday}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2"><Timer className="h-4 w-4" /> Avg. SLA Response</div>
            <div className="text-3xl font-bold">{avgSLA}m</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2"><Award className="h-4 w-4" /> Performance Badge</div>
            <div className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-medium ${badge.color}`}>{badge.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
