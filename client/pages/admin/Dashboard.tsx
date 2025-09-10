import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuth, setAdminAuth } from "@/lib/adminStore";
import { assignTask, readTasks, sortTasks } from "@/lib/workerStore";

export default function AdminDashboard() {
  const nav = useNavigate();
  const auth = getAdminAuth();
  const [tasks, setTasks] = useState(readTasks());
  const [scenario, setScenario] = useState({ extraPilgrims: 50000, hours: 2, toiletsDownPct: 0 });

  useEffect(() => {
    if (!auth) nav("/admin/login", { replace: true });
  }, [auth, nav]);

  useEffect(() => { setTasks(readTasks()); }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === 'worker_tasks') setTasks(readTasks()); };
    window.addEventListener('storage', onStorage);
    const id = setInterval(() => setTasks(readTasks()), 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(id); };
  }, []);

  const sorted = useMemo(() => tasks.slice().sort(sortTasks), [tasks]);
  const alerts = useMemo(() => sorted.filter(t => t.slaDueAt - Date.now() < 5*60*1000), [sorted]);
  const userRequests = useMemo(() => tasks.filter(t => t.source === 'user').slice().sort(sortTasks), [tasks]);

  const recommendation = useMemo(() => {
    const high = sorted.filter(t => t.priority === 'high').length;
    if (high >= 2) return "Deploy 2 cleaners to high-priority locations immediately.";
    if (alerts.length > 0) return "Escalate pending tasks nearing SLA.";
    return "All sectors normal.";
  }, [sorted, alerts]);

  const sim = useMemo(() => {
    // Simple deterministic model for demo
    const crowdFactor = scenario.extraPilgrims / (scenario.hours * 30000);
    const sanitationFactor = 1 + scenario.toiletsDownPct / 100;
    const risk = Math.min(1, crowdFactor * 0.6 + sanitationFactor * 0.4 - 0.3);
    const level = risk > 0.7 ? 'urgent' : risk > 0.4 ? 'warning' : 'safe';
    const staff = Math.max(0, Math.round(5 * risk * sanitationFactor));
    const healthUnits = Math.max(0, Math.round(2 * risk + (crowdFactor>1?1:0)));
    return { risk, level, staff, healthUnits };
  }, [scenario]);

  return (
    <div className="mx-auto max-w-5xl grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Workflow Monitoring</h1>
          <p className="text-sm text-muted-foreground">Tasks sorted by AI priority and SLA.</p>
        </div>
        <button onClick={() => { setAdminAuth(null); nav("/admin/login", { replace: true }); }} className="rounded-md border px-3 py-2 text-sm hover:bg-muted transition-transform hover:scale-110">Logout</button>
      </div>

      {/* Simulation Control Center */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="font-semibold">Simulation Control Center</div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <label className="grid gap-1"><span>Extra Pilgrims</span><input type="number" value={scenario.extraPilgrims} onChange={(e)=>setScenario({...scenario, extraPilgrims: Number(e.target.value)})} className="rounded-md border px-2 py-1"/></label>
          <label className="grid gap-1"><span>Hours</span><input type="number" value={scenario.hours} onChange={(e)=>setScenario({...scenario, hours: Number(e.target.value)})} className="rounded-md border px-2 py-1"/></label>
          <label className="grid gap-1"><span>Toilets Down %</span><input type="number" value={scenario.toiletsDownPct} onChange={(e)=>setScenario({...scenario, toiletsDownPct: Number(e.target.value)})} className="rounded-md border px-2 py-1"/></label>
          <div className="grid gap-1"><span>Predicted Level</span><div className={`rounded-md px-2 py-1 transition-transform hover:scale-110 ${sim.level==='urgent'?'bg-heatmap-urgent text-white':sim.level==='warning'?'bg-heatmap-warning':'bg-heatmap-safe text-white'}`}>{sim.level.toUpperCase()}</div></div>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3"><div className="text-sm text-muted-foreground">Predicted Task Load</div><div className="text-2xl font-bold">{Math.round(sim.risk*100)}%</div></div>
          <div className="rounded-lg border p-3"><div className="text-sm text-muted-foreground">Staff Required</div><div className="text-2xl font-bold">{sim.staff}</div></div>
          <div className="rounded-lg border p-3"><div className="text-sm text-muted-foreground">Mobile Health Units</div><div className="text-2xl font-bold">{sim.healthUnits}</div></div>
        </div>
      </div>

      {/* Pilgrim Help Requests */}
      <div className="rounded-2xl border border-red-300/60 bg-red-50/30 p-4 shadow-sm transition-transform hover:scale-[1.1] hover:shadow-md">
        <div className="font-semibold text-red-600">Pilgrim Help Requests (High Priority)</div>
        {userRequests.length === 0 && <div className="mt-1 text-sm text-red-700/80">No user help requests.</div>}
        <ul className="mt-2 grid gap-2 text-sm">
          {userRequests.map(r => (
            <li key={r.id} className="rounded-md border border-red-300/60 bg-white/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-red-700">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.location.name} • {r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input placeholder="Worker ID" defaultValue={r.assignedTo || ''} className="rounded-md border px-2 py-1 text-xs" id={`assign-${r.id}`} />
                  <button onClick={() => { const v=(document.getElementById(`assign-${r.id}`) as HTMLInputElement)?.value.trim(); if (!v) return; assignTask(r.id, v); setTasks(readTasks()); }} className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:opacity-90">Assign</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="font-semibold mb-2">Alerts</div>
        {alerts.length === 0 && <div className="text-sm text-muted-foreground">No immediate alerts.</div>}
        <ul className="grid gap-2 text-sm">
          {alerts.map(a => (
            <li key={a.id} className="rounded-md border border-red-500/40 bg-red-50/40 p-2">SLA breach risk: {a.title} @ {a.location.name}</li>
          ))}
        </ul>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl border bg-blue-50 dark:bg-blue-900/30 p-4 shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Task ID</th>
              <th>Title</th>
              <th>Location</th>
              <th>Priority</th>
              <th>SLA</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(t => (
              <tr key={t.id} className="border-t">
                <td className="py-2">{t.id}</td>
                <td>{t.title}</td>
                <td>{t.location.name}</td>
                <td className="capitalize">{t.priority}</td>
                <td>{Math.max(0, Math.floor((t.slaDueAt - Date.now())/60000))}m</td>
                <td className="capitalize">{t.status}</td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No tasks</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm transition-transform hover:scale-[1.1] hover:shadow-md">
        <div className="text-sm text-muted-foreground">AI Recommendation</div>
        <div className="mt-1 font-medium">{recommendation}</div>
      </div>
    </div>
  );
}
