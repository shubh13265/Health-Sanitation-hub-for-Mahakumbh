import { Navigate } from "react-router-dom";
import { getAdminAuth } from "@/lib/adminStore";

export default function AdminGate() {
  const a = getAdminAuth();
  return <Navigate to={a ? "/admin/dashboard" : "/admin/login"} replace />;
}
