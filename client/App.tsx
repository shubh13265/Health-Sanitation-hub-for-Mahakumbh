import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import Placeholder from "./pages/Placeholder";
import WorkerGate from "./pages/worker/Gate";
import WorkerLogin from "./pages/worker/Login";
import WorkerInbox from "./pages/worker/Inbox";
import WorkerTaskDetails from "./pages/worker/TaskDetails";
import WorkerProfile from "./pages/worker/Profile";
import Login from "./pages/Login";
import UserLogin from "./pages/user/Login";
import AdminGate from "./pages/admin/Gate";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import RiskScanner from "./pages/RiskScanner";
import Leaderboard from "./pages/Leaderboard";

const queryClient = new QueryClient();

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppLayout>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Index />} />
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/worker" element={<WorkerGate />} />
            <Route path="/worker/login" element={<WorkerLogin />} />
            <Route path="/worker/inbox" element={<WorkerInbox />} />
            <Route path="/worker/task/:id" element={<WorkerTaskDetails />} />
            <Route path="/worker/profile" element={<WorkerProfile />} />
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/risk-scanner" element={<RiskScanner />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(<App />);
