"use client";

// Talks to the self-hosted JWT auth API; persists {token,user} in localStorage.

const BASE =
  process.env.NEXT_PUBLIC_RELIGENCE_BACKEND_URL ?? "http://localhost:4000";
const KEY = "religence.auth";

export type AuthUser = { id: string; email: string; name: string };

async function post(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${BASE}/v1/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<void> {
  await post("/register", { name, email, password, confirmPassword });
}

export async function verifyEmail(token: string): Promise<void> {
  await post("/verify", { token });
}

export async function resendVerification(email: string): Promise<void> {
  await post("/resend-verification", { email });
}

export async function forgotPassword(email: string): Promise<void> {
  await post("/forgot-password", { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await post("/reset-password", { token, password });
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { token, user } = await post("/login", { email, password });
  localStorage.setItem(KEY, JSON.stringify({ token, user }));
  return user;
}

export function logout(): void {
  localStorage.removeItem(KEY);
}

function read(): { token: string; user: AuthUser } | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return read()?.token ?? null;
}

export function getUser(): AuthUser | null {
  return read()?.user ?? null;
}

/** True if a token exists and its JWT exp is in the future. */
export function isAuthed(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
