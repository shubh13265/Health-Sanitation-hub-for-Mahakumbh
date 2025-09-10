import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { completeTask, getAuth, openInMaps, readMessages, readTasks, sendMessage, updateTaskStatus } from "@/lib/workerStore";
import { ArrowLeft, Clock, MapPin, CheckCircle2, Play, MessageCircle, Mic, AlertCircle, Flag } from "lucide-react";

export default function WorkerTaskDetails() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const auth = getAuth();
  const [tick, setTick] = useState(0);
  const [tasks, setTasks] = useState(readTasks());
  const task = tasks.find((t) => t.id === id);

  useEffect(() => {
    if (!auth) nav("/worker/login", { replace: true });
  }, [auth, nav]);

  useEffect(() => {
    const int = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(int);
  }, []);

  const remaining = useMemo(() => Math.max(0, (task?.slaDueAt || 0) - Date.now()), [task, tick]);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const [chat, setChat] = useState<any[]>(readMessages(id!));
  const [input, setInput] = useState("");
  const recRef = useRef<any>(null);

  useEffect(() => {
    setTasks(readTasks());
    setChat(readMessages(id!));
  }, [id]);

  const send = () => {
    if (!input.trim()) return;
    const msg = sendMessage(id!, "worker", input.trim());
    setChat((c) => [...c, msg]);
    setInput("");
  };

  const speak = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recRef.current = recog;
    recog.lang = "en-IN";
    recog.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setInput(transcript);
    };
    recog.start();
  };

  if (!task) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link to="/worker" className="inline-flex items-center gap-2 text-sm underline"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <div className="mt-4 rounded-xl border p-6">Task not found.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl grid gap-4">
      <Link to="/worker" className="inline-flex items-center gap-2 text-sm underline"><ArrowLeft className="h-4 w-4" /> Back to Inbox</Link>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{task.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> {mins}m {secs}s left
          </div>
        </div>
        <p className="mt-2 text-muted-foreground text-sm">{task.description}</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button onClick={() => { updateTaskStatus(task.id, "in_progress"); setTasks(readTasks()); }} className="rounded-md bg-yellow-400 px-3 py-2 text-sm font-medium text-black shadow hover:opacity-90 inline-flex items-center gap-2"><Play className="h-4 w-4" /> In-Progress</button>
          <button onClick={() => { completeTask(task.id); nav('/worker'); }} className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow hover:opacity-90 inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Completed</button>
          <button onClick={() => { updateTaskStatus(task.id, "blocked"); setTasks(readTasks()); }} className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:opacity-90 inline-flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Report Issue</button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {task.location.name}</div>
          <a onClick={() => openInMaps(task.location.lat, task.location.lng)} className="text-sm underline cursor-pointer">Open in Maps</a>
        </div>
        <div className="mt-3 h-40 w-full rounded-lg border bg-gradient-to-br from-muted to-background grid place-items-center text-xs text-muted-foreground">
          Mini-map preview
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><MessageCircle className="h-4 w-4" /> Chat with Admin</div>
        <div className="max-h-60 overflow-auto rounded-md border bg-background p-3 text-sm">
          {chat.length === 0 && <div className="text-muted-foreground">No messages yet.</div>}
          {chat.map((m) => (
            <div key={m.id} className={`mb-2 max-w-[85%] rounded-2xl px-3 py-2 ${m.role === 'worker' ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-muted'}`}>{m.text}</div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded-md border px-3 py-2 text-sm shadow-sm" placeholder="Type your message" />
          <button onClick={speak} className="rounded-md border px-3 py-2"><Mic className="h-4 w-4" /></button>
          <button onClick={send} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Send</button>
        </div>
      </div>
    </div>
  );
}
