import { Navigate } from "react-router-dom";
import { getAuth } from "@/lib/workerStore";

export default function WorkerGate() {
  const auth = getAuth();
  return <Navigate to={auth ? "/worker/inbox" : "/worker/login"} replace />;
}
