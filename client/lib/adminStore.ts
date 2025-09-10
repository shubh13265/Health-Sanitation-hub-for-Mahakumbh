export interface AdminAuth { adminId: string; name: string }
const LS_ADMIN = "admin_auth";
export function getAdminAuth(): AdminAuth | null {
  const raw = localStorage.getItem(LS_ADMIN);
  return raw ? (JSON.parse(raw) as AdminAuth) : null;
}
export function setAdminAuth(a: AdminAuth | null) {
  if (a) localStorage.setItem(LS_ADMIN, JSON.stringify(a));
  else localStorage.removeItem(LS_ADMIN);
}
