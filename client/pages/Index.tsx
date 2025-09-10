import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MapPin, Droplets, Hospital, Trophy, MessageCircle, X, Flag, QrCode, Globe, RefreshCcw, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import TiltCard from "@/components/ui/TiltCard";
import FloatingQuote from "@/components/ui/FloatingQuote";
import { createTask } from "@/lib/workerStore";

// Types
type Message = { role: "user" | "ai"; text: string };

type Point = {
  id: string;
  name: string;
  type: "toilet" | "water" | "medical";
  lat: number;
  lng: number;
};

// Sample POIs near Ujjain (approximate coordinates)
const POIS: Point[] = [
  { id: "t1", name: "Toilet – Ram Ghat", type: "toilet", lat: 23.1839, lng: 75.7844 },
  { id: "t2", name: "Toilet – Sector B", type: "toilet", lat: 23.1772, lng: 75.7809 },
  { id: "w1", name: "Water Point – Kshipra Bank", type: "water", lat: 23.1821, lng: 75.7856 },
  { id: "w2", name: "Water Point – Mahakal Gate", type: "water", lat: 23.1828, lng: 75.7684 },
  { id: "m1", name: "Medical Help – Mobile Unit A", type: "medical", lat: 23.186, lng: 75.776 },
  { id: "m2", name: "Medical Help – Health Camp B", type: "medical", lat: 23.171, lng: 75.785 },
];

const UJJAIN_CENTER = { lat: 23.1765, lng: 75.7885 };

const LANGS = [
  { code: "hi-IN", label: "हिन्दी" },
  { code: "sa-IN", label: "संस्कृतम्" },
  { code: "en-IN", label: "English (India)" },
  { code: "en-US", label: "English (US)" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "mr-IN", label: "मराठी" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "ur-IN", label: "اردو" },
];

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const A =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * c; // meters
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState<string>(LANGS[0].code);
  const [score, setScore] = useState<number>(() => {
    const s = localStorage.getItem("hygiene_score");
    return s ? Number(s) : 0;
  });
  const recognitionRef = useRef<any>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [riskLocationName, setRiskLocationName] = useState("");
  const [riskNotes, setRiskNotes] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrIdx, setQrIdx] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<"toilets" | "sanitation" | "others">("toilets");
  const [reportText, setReportText] = useState("");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPosition(UJJAIN_CENTER),
      { enableHighAccuracy: true, timeout: 4000 }
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("hygiene_score", String(score));
  }, [score]);

  const startListening = async () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      pushAI("Voice not supported on this device. Use quick actions below.");
      return;
    }
    try { if (navigator.mediaDevices?.getUserMedia) await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
    try {
      const recog = new SR();
      recognitionRef.current = recog;
      recog.continuous = false;
      recog.lang = language;
      recog.interimResults = false;
      recog.maxAlternatives = 1;
      recog.onstart = () => setListening(true);
      recog.onerror = () => setListening(false);
      recog.onend = () => setListening(false);
      recog.onresult = (e: any) => {
        const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
        pushUser(transcript);
        const reply = handleQuery(transcript);
        pushAI(reply);
      };
      recog.start();
    } catch {
      setListening(false);
      pushAI("Microphone permission denied or unavailable.");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  const pushUser = (text: string) => setMessages((m) => [...m, { role: "user", text }]);
  const pushAI = (text: string) => setMessages((m) => [...m, { role: "ai", text }]);

  const findNearest = (type: Point["type"]) => {
    const origin = userPosition || UJJAIN_CENTER;
    const candidates = POIS.filter((p) => p.type === type);
    let best: { point: Point; dist: number } | null = null;
    for (const p of candidates) {
      const d = haversine(origin, { lat: p.lat, lng: p.lng });
      if (!best || d < best.dist) best = { point: p, dist: d };
    }
    return best;
  };

  const handleQuery = (q: string) => {
    const text = q.toLowerCase();
    const wantsToilet = /toilet|restroom|washroom|शौचालय|टॉयलेट|साफ|साफ़/.test(text);
    const wantsWater = /water|पानी|जल|पीने/.test(text);
    const wantsMedical = /medical|doctor|health|hospital|मेडिकल|ड���क्टर|स्वास्थ्य|अस्पताल/.test(text);

    if (wantsToilet) {
      const res = findNearest("toilet");
      if (res) return `Nearest toilet: ${res.point.name} • ${formatDistance(res.dist)} away.`;
      return "No toilets found nearby.";
    }
    if (wantsWater) {
      const res = findNearest("water");
      if (res) return `Nearest water point: ${res.point.name} • ${formatDistance(res.dist)} away.`;
      return "No water points found nearby.";
    }
    if (wantsMedical) {
      const res = findNearest("medical");
      if (res) return `Nearest medical help: ${res.point.name} • ${formatDistance(res.dist)} away.`;
      return "No medical units found nearby.";
    }
    return "I can help with toilets, water, or medical help. Try the quick actions below.";
  };

  const quickAction = (type: Point["type"]) => {
    const mapping: Record<Point["type"], string> = {
      toilet: "Nearest Toilet",
      water: "Water Point",
      medical: "Medical Help",
    };
    pushUser(mapping[type]);
    const res = findNearest(type);
    if (res) pushAI(`${mapping[type]} → ${res.point.name} • ${formatDistance(res.dist)} away.`);
  };

  const addPoints = (pts: number, reason: string) => {
    setScore((s) => s + pts);
    pushAI(`${pts} points added for ${reason}. Your Hygiene Score is now ${score + pts}.`);
  };

  const sendHelpRequest = () => {
    const pos = userPosition || UJJAIN_CENTER;
    const name = riskLocationName.trim() || "User Location";
    const desc = riskNotes.trim() || "User-reported risk. Please assist.";
    createTask({
      title: `Assist Pilgrim – ${name}`,
      description: desc,
      priority: "high",
      slaDueAt: Date.now() + 20 * 60 * 1000,
      location: { name, lat: pos.lat, lng: pos.lng },
      status: "pending",
    });
    pushAI(`Help request sent for ${name}. Workers have been notified.`);
    setRiskLocationName("");
    setRiskNotes("");
  };

  const refreshScore = () => {
    const s = localStorage.getItem("hygiene_score");
    const v = s ? Number(s) : 0;
    setScore(v);
    pushAI(`Hygiene Score refreshed. Current score is ${v}.`);
  };

  const restoreScore = () => {
    setScore(0);
    localStorage.setItem("hygiene_score", "0");
    pushAI("Hygiene Score restored to default (0).");
  };

  const QR_IMAGES = [
    "https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2F9240ac77a7cb4b778777d58a3021ec43?format=webp&width=800",
    "https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2F9025779fe24441099db207a2bf9e2037?format=webp&width=800",
    "https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2F48e609bc547f4967aee345ee8abf9d97?format=webp&width=800",
    "https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2Fb29c6b18399e4ce78cf4ba47d8e32192?format=webp&width=800",
  ];

  const languagesToShow = useMemo(() => (listening ? LANGS.slice(0, 10) : LANGS), [listening]);

  const openQR = () => setQrOpen(true);
  const confirmQR = () => {
    addPoints(10, "scanning a clean facility QR");
    setQrOpen(false);
    setQrIdx((i) => (i + 1) % QR_IMAGES.length);
  };

  const SHOPS = [
    { name: "Prasad Stall – Ram Ghat", lat: 23.1837, lng: 75.7846 },
    { name: "Snack Shop – Sector B", lat: 23.1770, lng: 75.7812 },
    { name: "Tea Point – Kshipra Bank", lat: 23.1823, lng: 75.7851 },
  ];

  const header = (
    <div className="mx-auto max-w-3xl text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
        Clean Pilgrimage, Safe Kumbh
      </h1>
      <p className="mt-3 text-muted-foreground">
        Ask for toilets, water, or medical help. Speak in Hindi, Sanskrit, or English.
      </p>
    </div>
  );

  return (
    <div className="grid gap-6">
      {/* Hero Images */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TiltCard src="https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2Fd10fc5848eb440c19d65ff491074c086?format=webp&width=800" alt="Hand washing hygiene" title="Wash Hands Frequently" />
        <TiltCard src="https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2F83543a6b138f42039828bf851d7dc819?format=webp&width=800" alt="Street garbage issue" title="Keep Areas Clean" />
        <TiltCard src="https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2Fb068295139024e39ac38d5e26ee78bef?format=webp&width=800" alt="Kumbh hygiene challenge" title="Clean Kumbh Initiative" />
      </div>

      {header}

      <div className="mx-auto max-w-3xl grid gap-6">
        {/* Voice + Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
            >
              {languagesToShow.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={listening ? stopListening : startListening}
            className={cn(
              "relative inline-flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all",
              listening ? "bg-accent text-accent-foreground ring-4 ring-accent/40 scale-105" : "bg-primary text-primary-foreground hover:scale-110"
            )}
            aria-label={listening ? "Stop listening" : "Tap to speak"}
          >
            <Mic className="h-10 w-10" />
          </button>
          <div className="text-sm text-muted-foreground">{listening ? "Listening… Tap to stop" : "Tap to speak"}</div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => quickAction("toilet")} className="flex items-center justify-center gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow transition-transform hover:scale-110 hover:shadow-lg hover:bg-muted cursor-pointer">
            <MapPin className="h-5 w-5 text-primary" /> <span>Nearest Toilet</span>
          </button>
          <button onClick={() => quickAction("water")} className="flex items-center justify-center gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow transition-transform hover:scale-110 hover:shadow-lg hover:bg-muted cursor-pointer">
            <Droplets className="h-5 w-5 text-secondary" /> <span>Water Point</span>
          </button>
          <button onClick={() => quickAction("medical")} className="flex items-center justify-center gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow transition-transform hover:scale-110 hover:shadow-lg hover:bg-muted cursor-pointer">
            <Hospital className="h-5 w-5 text-destructive" /> <span>Medical Help</span>
          </button>
        </div>

        {/* Chat */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>Voice Bot</span>
            </div>
            <button onClick={() => setMessages([])} className="rounded-md border bg-background px-3 py-1.5 text-xs shadow-sm hover:bg-muted">Clear Chat</button>
          </div>
          <div className="flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-muted-foreground">Your conversations will appear here.</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted text-foreground")}>{m.text}</div>
            ))}
          </div>
        </div>

        {/* Help Request (User Risk Location) */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-center bg-cover opacity-20"
            style={{ backgroundImage: 'url("https://cdn.builder.io/api/v1/image/assets%2F5fc93eab37d94c50a1f656072c46ec6a%2F7235d562f21b4769a300a0db875f458c?format=webp&width=800")' }}
          />
          <div className="relative flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Request Help at Your Location</span>
          </div>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <label className="text-sm">Location name</label>
              <input value={riskLocationName} onChange={(e)=>setRiskLocationName(e.target.value)} placeholder="e.g., Ram Ghat stairs"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Notes (optional)</label>
              <textarea value={riskNotes} onChange={(e)=>setRiskNotes(e.target.value)} rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm" />
            </div>
            <div className="text-xs text-muted-foreground">Using your current location: {userPosition ? `${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}` : "locating…"}</div>
            <div className="flex justify-end">
              <button onClick={sendHelpRequest} className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-transform hover:scale-110 hover:shadow-lg cursor-pointer">Send Help Request</button>
            </div>
          </div>
        </div>

        {/* Hygiene Score & Rewards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl border bg-card p-4 shadow-sm transition-transform hover:scale-[1.01]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Hygiene Score</div>
                <div className="text-3xl font-bold">{score}</div>
              </div>
              <Trophy className="h-10 w-10 text-accent" />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <button onClick={openQR}
                className="flex items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted transition-transform hover:scale-110 hover:shadow-lg cursor-pointer">
                <QrCode className="h-4 w-4" /> Scan QR at Clean Facility
              </button>
              <button onClick={() => setReportOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted transition-transform hover:scale-110 hover:shadow-lg cursor-pointer">
                <Flag className="h-4 w-4" /> Report Issue
              </button>
              <button onClick={restoreScore}
                className="flex items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted transition-transform hover:scale-110 hover:shadow-lg cursor-pointer">
                <RotateCcw className="h-4 w-4" /> Restore
              </button>
            </div>
            <div className="mt-4">
              <FloatingQuote text="The responsibility for sanitation begins with the individual.... Let personal action create collective cleanliness." />
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="text-sm text-muted-foreground">Tokens & Shops</div>
            <div className="mt-2 text-lg font-semibold">Your Tokens: {score}</div>
            <div className="mt-3 text-sm text-muted-foreground">Earn tokens by scanning clean facility QR codes or reporting issues. Use tokens at nearby stalls.</div>
            <ul className="mt-3 grid gap-2 text-sm">
              {SHOPS.map((s, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border p-2">
                  <div>{s.name}</div>
                  <a className="underline text-primary" href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noreferrer">Open</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {qrOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Scan QR</div>
              <button onClick={() => setQrOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <img src={QR_IMAGES[qrIdx]} alt="QR code" className="mt-3 w-full rounded-lg border bg-white p-3 object-contain" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setQrOpen(false)} className="rounded-md border px-3 py-2 text-sm">Cancel</button>
              <button onClick={confirmQR} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Simulate Scan</button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Report Issue</div>
              <button onClick={() => setReportOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 grid gap-2">
              <label className="text-sm">Category</label>
              <div className="flex gap-2">
                <button onClick={() => setReportCategory('toilets')} className={`rounded-md border px-3 py-1 text-sm ${reportCategory==='toilets'?'bg-primary text-primary-foreground':''}`}>Toilets</button>
                <button onClick={() => setReportCategory('sanitation')} className={`rounded-md border px-3 py-1 text-sm ${reportCategory==='sanitation'?'bg-primary text-primary-foreground':''}`}>Sanitation</button>
                <button onClick={() => setReportCategory('others')} className={`rounded-md border px-3 py-1 text-sm ${reportCategory==='others'?'bg-primary text-primary-foreground':''}`}>Others</button>
              </div>
              <label className="text-sm mt-2">Note</label>
              <textarea rows={3} value={reportText} onChange={(e)=>setReportText(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm" placeholder="Describe the issue" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setReportOpen(false)} className="rounded-md border px-3 py-2 text-sm">Cancel</button>
              <button onClick={() => { addPoints(15, `reporting a ${reportCategory} issue`); createTask({ title: `Issue: ${reportCategory}`, description: reportText || 'User reported issue', priority: 'medium', slaDueAt: Date.now()+30*60*1000, location: { name: riskLocationName || 'User Location', lat: (userPosition||UJJAIN_CENTER).lat, lng: (userPosition||UJJAIN_CENTER).lng }, status: 'pending' }); setReportOpen(false); setReportText(''); }} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
