export type Priority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";

export interface WorkerAuth {
  workerId: string;
  name: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  slaDueAt: number; // epoch ms
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  source?: "system" | "user";
  assignedTo?: string; // workerId
}

export interface OutboxAction {
  id: string; // action id
  taskId: string;
  type: "status_update" | "message";
  payload: any;
  queuedAt: number;
  syncedAt?: number;
}

const LS_TASKS = "worker_tasks";
const LS_OUTBOX = "worker_outbox";
const LS_AUTH = "worker_auth";

const now = () => Date.now();

export function generateDefaultTasks(baseTime: number = now()): TaskItem[] {
  const t = baseTime;
  return [
    {
      id: "t-1",
      title: "Clean Toilet – Sector B",
      description: "Toilet block near Gate 2, Sector B. Mop, restock supplies, sanitize.",
      priority: "high",
      slaDueAt: t + 15 * 60 * 1000,
      location: { name: "Sector B Gate 2", lat: 23.1772, lng: 75.7809 },
      status: "pending",
      createdAt: t,
      updatedAt: t,
      source: "system",
    },
    {
      id: "t-2",
      title: "Refill Water – Kshipra Bank",
      description: "Refill and check cleanliness around water point.",
      priority: "medium",
      slaDueAt: t + 35 * 60 * 1000,
      location: { name: "Kshipra River Bank", lat: 23.1821, lng: 75.7856 },
      status: "pending",
      createdAt: t,
      updatedAt: t,
      source: "system",
    },
    {
      id: "t-3",
      title: "Empty Bin – Ram Ghat",
      description: "Overflowing bin near main stairs. Replace liner and clean area.",
      priority: "low",
      slaDueAt: t + 60 * 60 * 1000,
      location: { name: "Ram Ghat", lat: 23.1839, lng: 75.7844 },
      status: "pending",
      createdAt: t,
      updatedAt: t,
      source: "system",
    },
  ];
}

export function getAuth(): WorkerAuth | null {
  const raw = localStorage.getItem(LS_AUTH);
  return raw ? (JSON.parse(raw) as WorkerAuth) : null;
}

export function setAuth(auth: WorkerAuth | null) {
  if (auth) localStorage.setItem(LS_AUTH, JSON.stringify(auth));
  else localStorage.removeItem(LS_AUTH);
}

export function seedTasksOnce() {
  if (!localStorage.getItem(LS_TASKS)) {
    localStorage.setItem(LS_TASKS, JSON.stringify(generateDefaultTasks()));
  }
}

export function readTasks(): TaskItem[] {
  seedTasksOnce();
  const raw = localStorage.getItem(LS_TASKS);
  return raw ? (JSON.parse(raw) as TaskItem[]) : [];
}

export function writeTasks(tasks: TaskItem[]) {
  localStorage.setItem(LS_TASKS, JSON.stringify(tasks));
}

export function clearOutbox() {
  localStorage.removeItem(LS_OUTBOX);
}

export function resetTasksForNewLogin(baseTime: number = now()) {
  const tasks = generateDefaultTasks(baseTime);
  writeTasks(tasks);
  clearOutbox();
}

export function readOutbox(): OutboxAction[] {
  const raw = localStorage.getItem(LS_OUTBOX);
  return raw ? (JSON.parse(raw) as OutboxAction[]) : [];
}

export function writeOutbox(items: OutboxAction[]) {
  localStorage.setItem(LS_OUTBOX, JSON.stringify(items));
}

export function enqueueAction(action: Omit<OutboxAction, "id" | "queuedAt">) {
  const out = readOutbox();
  out.push({ id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, queuedAt: now(), ...action });
  writeOutbox(out);
}

// Simulated sync: marks actions as synced
export async function syncOutbox() {
  const out = readOutbox();
  if (out.length === 0) return;
  const synced = out.map((a) => ({ ...a, syncedAt: now() }));
  writeOutbox(synced);
  // In real app, would POST to server and then clear the queue when confirmed
}

export function priorityWeight(p: Priority) {
  return p === "high" ? 3 : p === "medium" ? 2 : 1;
}

export function sortTasks(a: TaskItem, b: TaskItem) {
  const w = priorityWeight(b.priority) - priorityWeight(a.priority);
  if (w !== 0) return w;
  return a.slaDueAt - b.slaDueAt;
}

export function createTask(input: {
  title: string;
  description: string;
  priority: Priority;
  slaDueAt: number;
  location: { name: string; lat: number; lng: number };
  status?: TaskStatus;
  assignedTo?: string;
}) {
  const nowTs = now();
  const task: TaskItem = {
    id: `t-${nowTs}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title,
    description: input.description,
    priority: input.priority,
    slaDueAt: input.slaDueAt,
    location: input.location,
    status: input.status || "pending",
    createdAt: nowTs,
    updatedAt: nowTs,
    source: "user",
    assignedTo: input.assignedTo,
  };
  const tasks = readTasks();
  tasks.push(task);
  writeTasks(tasks);
  return task;
}

export function assignTask(taskId: string, workerId: string) {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], assignedTo: workerId, updatedAt: now() };
    writeTasks(tasks);
    enqueueAction({ taskId, type: "message", payload: { system: true, text: `Assigned to ${workerId}` } });
    return tasks[idx];
  }
  return null;
}

export function updateTaskStatus(taskId: string, status: TaskStatus) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], status, updatedAt: now() };
    writeTasks(tasks);
    enqueueAction({ taskId, type: "status_update", payload: { status } });
  }
}

export function completeTask(taskId: string) {
  const tasks = readTasks().filter((t) => t.id !== taskId);
  writeTasks(tasks);
  enqueueAction({ taskId, type: "status_update", payload: { status: "completed" } });
}

export function sendMessage(taskId: string, role: "worker" | "admin", text: string) {
  const key = `worker_chat_${taskId}`;
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  const msg = { id: `m-${Date.now()}`, role, text, at: now() };
  list.push(msg);
  localStorage.setItem(key, JSON.stringify(list));
  enqueueAction({ taskId, type: "message", payload: msg });
  return msg;
}

export function readMessages(taskId: string) {
  const key = `worker_chat_${taskId}`;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

export function openInMaps(lat: number, lng: number) {
  const url = `https://www.google.com/maps?q=${lat},${lng}`;
  window.open(url, "_blank");
}

export function priorityMeta(p: Priority) {
  if (p === "high") return { label: "High", color: "text-white bg-red-600", border: "border-red-500" };
  if (p === "medium") return { label: "Medium", color: "text-black bg-yellow-400", border: "border-yellow-400" };
  return { label: "Low", color: "text-white bg-green-600", border: "border-green-500" };
}
