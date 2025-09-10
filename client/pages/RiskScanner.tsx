import { useEffect, useRef, useState } from "react";
import { UploadCloud, Camera, Video } from "lucide-react";
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function RiskScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ crowd: number; sanitation: number; level: "low" | "medium" | "high" } | null>(null);
  const [objects, setObjects] = useState<{ label: string; count: number; confidence: number }[]>([]);
  const [series, setSeries] = useState<{ t: number; crowd: number; sanitation: number }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ambulanceNotified, setAmbulanceNotified] = useState(false);
  const [policeNotified, setPoliceNotified] = useState(false);
  const [calledEmergency, setCalledEmergency] = useState(false);
  const [resources, setResources] = useState<{
    police: { name: string; dist: number };
    emergency: { name: string; dist: number }[];
    army: { name: string; dist: number };
  } | null>(null);
  const [garbageKg, setGarbageKg] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<any>(null);

  const seedRand = (seed: number) => {
    let x = seed | 0;
    return () => {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0;
      return ((x >>> 0) % 1000) / 1000; // 0..1
    };
  };

  const onFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setAmbulanceNotified(false);
    analyze(f);
  };

  const loadFromUrl = (url: string, seedLabel: string) => {
    setFile(null);
    setPreview(url);
    setAmbulanceNotified(false);
    analyze(undefined, seedLabel);
  };

  const analyze = (f?: File, seedLabel?: string) => {
    const seedBase = (f?.size || 1) + (f?.name.length || 0) + (seedLabel ? seedLabel.length * 37 : 0);
    const rnd = seedRand(seedBase);

    let crowd = 0.3 + rnd() * 0.7; // 0.3..1
    let sanitationGood = 0.3 + rnd() * 0.7; // 0..1 (higher is better)

    if (seedLabel === 'drone') {
      crowd = 0.92; // very high crowd in aerial image
      sanitationGood = 0.35; // lower sanitation due to overload
    } else if (seedLabel === 'cctv') {
      crowd = 0.70; // moderate-high crowd in CCTV snapshot
      sanitationGood = 0.55; // medium sanitation
    }

    const score = 0.6 * crowd + 0.4 * (1 - sanitationGood);
    const level = score > 0.7 ? "high" : score > 0.45 ? "medium" : "low";
    const sanitationRisk = 1 - sanitationGood;
    setResult({ crowd, sanitation: sanitationRisk, level });

    const candidates = [
      { label: "Toilet", base: 2 },
      { label: "Water Tap", base: 2 },
      { label: "Waste Bin", base: 3 },
      { label: "Litter Spot", base: 2 },
      { label: "Handwash Station", base: 1 },
      { label: "Medical Tent", base: 1 },
      { label: "Crowd Cluster", base: 4 },
      { label: "Open Drain", base: 1 },
    ];
    const objs = candidates.map(c => ({
      label: c.label,
      count: Math.max(0, Math.round(c.base * (0.6 + rnd() + (c.label === 'Crowd Cluster' ? crowd : 0) + (c.label.includes('Litter') || c.label.includes('Bin') ? sanitationRisk*0.8 : 0)))),
      confidence: 0.6 + rnd() * 0.4,
    }));
    setObjects(objs);

    const garbage = Math.round(80 + crowd * 400 + sanitationRisk * 300);
    setGarbageKg(garbage);
    setResources({
      police: { name: seedLabel==='drone' ? 'Police Post — Ram Ghat' : 'Police Post — Sector B Gate 2', dist: 0.4 + rnd()*0.9 },
      emergency: [
        { name: 'Ambulance Unit A', dist: 0.6 + rnd()*1.0 },
        { name: 'Medical Team — Mobile', dist: 0.3 + rnd()*0.9 },
      ],
      army: { name: 'NDRF/Army Patrol', dist: 1.0 + rnd()*1.5 },
    });

    // Stop live series (removed live monitoring view)
    if (timerRef.current) clearInterval(timerRef.current);
    setSeries([]);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div className="mx-auto max-w-5xl grid gap-4 min-h-[80vh] pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Risk Scanner</h1>
        <p className="text-muted-foreground">Upload an image to analyze crowd and sanitation risk. Works offline; processing is simulated on-device.</p>
        <div className="mt-3 flex items-center gap-3 relative">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          <button onClick={() => setMenuOpen((v)=>!v)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground shadow hover:opacity-90 transition-transform hover:scale-110">
            <UploadCloud className="h-4 w-4" /> Input Image for Processing
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-md border bg-card p-2 shadow">
              <button onClick={() => { setMenuOpen(false); inputRef.current?.click(); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted">
                <Camera className="h-4 w-4" /> Upload from Device
              </button>
              <button onClick={() => { setMenuOpen(false); loadFromUrl('https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2Fe9aa696abfc0494a9b1be18feb591a5c?format=webp&width=1200','cctv'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted">
                <Video className="h-4 w-4" /> Use CCTV Snapshot
              </button>
              <button onClick={() => { setMenuOpen(false); loadFromUrl('https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2Ff970a054a98344278d67e4e8546aa732?format=webp&width=1200','drone'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted">
                <Camera className="h-4 w-4" /> Use Drone Snapshot
              </button>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="grid gap-3">
              <div className="rounded-lg overflow-hidden border relative">
                <img src={preview} alt="uploaded" className="w-full h-auto" />
              </div>
              {resources && (
                <div className="rounded-lg border border-blue-900 bg-blue-900 text-blue-50 p-2">
                  <div className="text-sm text-white mb-2">Nearby Units</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 transition-transform hover:scale-110 hover:shadow-md text-blue-900">
                      <div className="text-xs font-semibold">Police</div>
                      <div className="text-[10px] text-muted-foreground">{resources.police.name}</div>
                      <div className="text-[10px]">{resources.police.dist.toFixed(2)} km</div>
                      <div className="mt-1 flex gap-2">
                        <a href="tel:100" onClick={()=>setPoliceNotified(true)} className="rounded-md border px-2 py-1 text-xs hover:bg-blue-100">Call Police</a>
                      </div>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 transition-transform hover:scale-110 hover:shadow-md text-blue-900">
                      <div className="text-xs font-semibold">Police Post</div>
                      <div className="text-[10px] text-muted-foreground">{resources.police.name}</div>
                      <div className="text-[10px]">{resources.police.dist.toFixed(2)} km</div>
                    </div>
                    {resources.emergency.map((e,i)=> (
                      <div key={i} className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 transition-transform hover:scale-110 hover:shadow-md text-blue-900">
                        <div className="text-xs font-semibold">Emergency Team</div>
                        <div className="text-[10px] text-muted-foreground">{e.name}</div>
                        <div className="text-[10px]">{e.dist.toFixed(2)} km</div>
                        <div className="mt-1 flex gap-2">
                          <a href="tel:108" onClick={()=>setCalledEmergency(true)} className="rounded-md bg-red-600 text-white px-2 py-1 text-xs hover:opacity-90">Call</a>
                        </div>
                      </div>
                    ))}
                    <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 transition-transform hover:scale-110 hover:shadow-md text-blue-900">
                      <div className="text-xs font-semibold">NDRF</div>
                      <div className="text-[10px] text-muted-foreground">Rapid Response Team</div>
                      <div className="text-[10px]">{(resources.army.dist + 0.2).toFixed(2)} km</div>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 transition-transform hover:scale-110 hover:shadow-md text-blue-900">
                      <div className="text-xs font-semibold">Protection Army</div>
                      <div className="text-[10px] text-muted-foreground">{resources.army.name}</div>
                      <div className="text-[10px]">{resources.army.dist.toFixed(2)} km</div>
                      <div className="mt-1 flex gap-2">
                        <a href="tel:100" onClick={()=>setPoliceNotified(true)} className="rounded-md border px-2 py-1 text-xs hover:bg-blue-100">Police</a>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1">
                    {policeNotified && <div className="rounded-md border border-blue-300 bg-blue-50 p-2 text-xs text-black">Police coordination initiated.</div>}
                    {calledEmergency && <div className="rounded-md border border-green-300 bg-green-50 p-2 text-xs text-black">Emergency team dial initiated.</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-emerald-900/20 p-4 grid gap-3">
              <div className="text-sm text-black">Results</div>
              {result && (() => {
                const crowdLevel = result.crowd > 0.75 ? 'High' : result.crowd > 0.5 ? 'Medium' : 'Low';
                const healthRisk = Math.min(1, Math.max(0, 0.5 * result.sanitation + 0.5 * result.crowd));
                const emergencyRisk = Math.min(1, Math.max(0, 0.6 * result.crowd + 0.3 * result.sanitation));
                return (
                  <div className="grid gap-2 text-sm">
                    <div>Crowd: {crowdLevel} ({result.crowd.toFixed(2)})</div>
                    <div>Sanitation Risk due to crowd: {result.sanitation.toFixed(2)}</div>
                    <div>Estimated Garbage Accumulation: {garbageKg ?? 0} kg</div>
                    <div>Health Risk: {healthRisk.toFixed(2)}</div>
                    <div>Emergency Risk: {emergencyRisk.toFixed(2)}</div>
                    <div className="flex items-center gap-2">Priority Level: {result.level === 'high' ? '🟥 High' : result.level === 'medium' ? '🟡 Medium' : '🟢 Low'}</div>
                    {emergencyRisk > 0.55 && (
                      <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs">Recommendation: Inform ambulance in advance for better communication and response time.</div>
                    )}
                    <div className="flex justify-end pt-2">
                      <button onClick={() => { setAmbulanceNotified(true); }} className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:opacity-90 transition-transform hover:scale-110">Inform Ambulance Now</button>
                    </div>
                    {ambulanceNotified && (<div className="mt-2 rounded-md border border-green-400 bg-green-50 p-2 text-xs">Ambulance control room notified with current location and crowd level.</div>)}
                                      </div>
                );
              })()}
              <div>
                <div className="text-sm text-black">Detected Objects</div>
                <div className="mt-2 overflow-hidden rounded-md border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-foreground/80">
                      <tr>
                        <th className="px-2 py-1 text-left">Object</th>
                        <th className="px-2 py-1 text-left">Count</th>
                        <th className="px-2 py-1 text-left">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {objects.map((o, i) => (
                        <tr key={i} className="bg-background/40">
                          <td className="px-2 py-1">{o.label}</td>
                          <td className="px-2 py-1">{o.count}</td>
                          <td className="px-2 py-1">{(o.confidence*100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 xl:col-span-2">
              <div className="text-sm text-muted-foreground mb-2">Facility Mix</div>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <BarChart data={objects.map(o=>({ label:o.label, count:o.count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-15} height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
