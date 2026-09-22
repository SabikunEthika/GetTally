"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { API, saveSession } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not sign in");
      saveSession(data.token, data.seller); router.push("/");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not sign in"); } finally { setLoading(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6 py-10 text-[#20231f]"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm font-semibold text-[#4f6f52]">Welcome back</p><h1 className="mt-2 text-3xl font-bold">Sign in to GetTally</h1><p className="mt-2 text-sm text-gray-500">Your orders, earnings, and growth in one place.</p>{error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="mt-6 block text-sm font-medium">Gmail<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#4f6f52]" /></label><label className="mt-4 block text-sm font-medium">Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#4f6f52]" /></label><button disabled={loading} className="mt-6 w-full rounded-2xl bg-[#20231f] px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button><p className="mt-6 text-center text-sm text-gray-500">New to GetTally? <Link href="/register" className="font-semibold text-[#4f6f52]">Create an account</Link></p><p className="mt-3 text-center text-xs text-gray-400">Demo: gettally.demo@gmail.com / DemoPass123</p></form></main>;
}
