"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { API, saveSession } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", businessName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    try { const response = await fetch(`${API}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || "Could not create account"); saveSession(data.token, data.seller); router.push("/profile"); } catch (err) { setError(err instanceof Error ? err.message : "Could not create account"); } finally { setLoading(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6 py-10 text-[#20231f]"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm font-semibold text-[#4f6f52]">Start tracking smarter</p><h1 className="mt-2 text-3xl font-bold">Create your seller account</h1><p className="mt-2 text-sm text-gray-500">Use a Gmail address and Bangladesh mobile number.</p>{error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Your name<input required value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" /></label><label className="text-sm font-medium">Business name<input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" /></label></div><label className="mt-4 block text-sm font-medium">Gmail<input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@gmail.com" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" /></label><label className="mt-4 block text-sm font-medium">Bangladesh mobile number<input required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="01712345678 or +8801712345678" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" /></label><label className="mt-4 block text-sm font-medium">Password<input required type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 8 characters and a number" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" /></label><button disabled={loading} className="mt-6 w-full rounded-2xl bg-[#4f6f52] px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Creating account…" : "Create account"}</button><p className="mt-6 text-center text-sm text-gray-500">Already registered? <Link href="/login" className="font-semibold text-[#4f6f52]">Sign in</Link></p></form></main>;
}
