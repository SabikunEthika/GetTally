"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearSession, getToken, logout } from "../lib/api";

type Order = {
  id: number;
  customerName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  orderItems?: { quantity: number; product?: { name: string } }[];
};

type Report = {
  totalOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  totalEarnings: number;
  profit: number | null;
  returnRate: number;
  topProduct: { name: string; quantity: number } | null;
  monthlySales: { month: string; revenue: number }[];
  summary: string;
  currentMonthRevenue: number;
  growthPercent: number | null;
};

const taka = (value: number) => `৳${Math.round(value).toLocaleString("en-BD")}`;

export default function Home() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<{ id: number; name: string; businessName?: string | null; monthlyGoal?: number | null } | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!getToken()) { router.replace("/login"); return; }
      const profileResponse = await apiFetch("/api/auth/me");
      if (!profileResponse.ok) { clearSession(); router.replace("/login"); return; }
      const profileData = await profileResponse.json();
      setProfile(profileData);
      const [reportResponse, ordersResponse] = await Promise.all([
        apiFetch(`/api/orders/report/${profileData.id}`),
        apiFetch(`/api/orders/seller/${profileData.id}`),
      ]);
      const reportData = await reportResponse.json();
      const ordersData = await ordersResponse.json();
      if (!reportData.success || !ordersData.success) throw new Error("The server could not load your records.");
      setReport(reportData.data);
      setOrders(ordersData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to GetTally.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const chart = useMemo(() => {
    const values = report?.monthlySales.slice(-6) || [];
    const max = Math.max(...values.map((item) => item.revenue), 1);
    return values.map((item) => ({ ...item, height: Math.max(8, (item.revenue / max) * 100) }));
  }, [report]);

  const updateStatus = async (orderId: number, status: string) => {
    let returnReason: string | undefined;
    if (status === "returned") {
      returnReason = window.prompt("Why was this order returned?") || "";
      if (!returnReason.trim()) return;
    }
    const response = await apiFetch(`/api/orders/${orderId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, returnReason }),
    });
    const data = await response.json();
    if (!data.success) { window.alert(data.message || "Could not update status"); return; }
    await loadDashboard();
  };

  const monthlyGoal = profile?.monthlyGoal || 0;
  const goalProgress = monthlyGoal && report ? Math.min(100, Math.round((report.currentMonthRevenue / monthlyGoal) * 100)) : 0;
  const signOut = async () => { await logout(); router.replace("/login"); };
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#20231f]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight">Get<span className="text-[#4f6f52]">Tally</span></h1><p className="mt-1 text-sm text-gray-500">{profile?.businessName || `${profile?.name || "Seller"}'s business`}</p></div>
          <div className="flex flex-wrap gap-3"><button onClick={() => router.push("/profile")} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold">Profile</button><button onClick={() => router.push("/chat")} className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold">Paste chat</button><button onClick={() => router.push("/voice")} className="rounded-full bg-[#20231f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4f6f52]">+ Add order</button><button onClick={() => void signOut()} className="rounded-full px-2 py-2 text-sm text-gray-500">Log out</button></div>
        </header>

        <section className="mt-10 rounded-3xl bg-[#dfe8dc] p-8"><p className="text-sm font-medium text-[#4f6f52]">Good to see you 👋</p><h2 className="mt-2 text-3xl font-bold">Here&apos;s how your business is doing.</h2><p className="mt-3 max-w-2xl text-gray-600">{report?.summary || "Confirm an order to start building your business picture."}</p></section>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <button onClick={() => void loadDashboard()} className="ml-2 font-semibold underline">Retry</button></div>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[{ label: "Sales", value: taka(report?.totalEarnings || 0), note: `${report?.confirmedOrders || 0} confirmed orders` }, { label: "Profit", value: report?.profit === null || report?.profit === undefined ? "—" : taka(report.profit), note: report?.profit === null ? "Add product costs to track" : "After product costs" }, { label: "Delivered", value: String(report?.deliveredOrders || 0), note: `${report?.totalOrders || 0} total orders` }, { label: "Returns", value: String(report?.returnedOrders || 0), note: `${report?.returnRate || 0}% return rate` }].map((card) => <div key={card.label} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">{card.label}</p><p className="mt-3 text-3xl font-bold">{card.value}</p><p className="mt-2 text-sm text-[#4f6f52]">{card.note}</p></div>)}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2"><div className="flex items-start justify-between"><div><h3 className="text-xl font-bold">Sales overview</h3><p className="mt-1 text-sm text-gray-500">Confirmed and delivered orders by month</p></div>{report?.topProduct && <span className="rounded-full bg-[#eef3eb] px-4 py-2 text-xs font-semibold text-[#4f6f52]">Top: {report.topProduct.name}</span>}</div><div className="mt-8 flex h-56 items-end gap-3">{chart.length ? chart.map((item) => <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-xl bg-[#4f6f52]" style={{ height: `${item.height}%` }} title={taka(item.revenue)} /><span className="text-xs text-gray-400">{item.month.slice(5)}</span></div>) : <p className="self-center text-sm text-gray-400">Monthly performance will appear here.</p>}</div></div>
          <div className="rounded-3xl bg-[#20231f] p-7 text-white"><p className="text-sm text-gray-400">Quick log</p><h3 className="mt-3 text-2xl font-bold">Sold something outside Messenger?</h3><p className="mt-3 text-sm leading-6 text-gray-400">Speak naturally or paste a conversation. You review every AI draft before it reaches your records.</p><button onClick={() => router.push("/voice")} className="mt-8 w-full rounded-2xl bg-white px-5 py-4 font-semibold text-[#20231f]">🎙 Log by voice</button></div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-[#4f6f52]">Personal growth</p><h3 className="mt-2 text-2xl font-bold">Build a steadier month</h3><p className="mt-2 text-sm text-gray-500">{report?.growthPercent === null ? "Complete one more month to see growth." : `${report?.growthPercent ?? 0}% compared with last month`}</p><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#eef3eb]"><div className="h-full rounded-full bg-[#4f6f52]" style={{ width: `${goalProgress}%` }} /></div><div className="mt-3 flex justify-between text-sm"><span>{taka(report?.currentMonthRevenue || 0)} this month</span><span>{monthlyGoal ? `${goalProgress}% of ${taka(monthlyGoal)} goal` : "Set a goal in Profile"}</span></div></div>
          <div className="rounded-3xl bg-[#dfe8dc] p-6"><p className="text-sm font-semibold text-[#4f6f52]">Sell tracker</p><h3 className="mt-2 text-2xl font-bold">Your order pipeline</h3><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-white/70 p-4"><p className="text-gray-500">Confirmed</p><p className="mt-1 text-2xl font-bold">{report?.confirmedOrders || 0}</p></div><div className="rounded-2xl bg-white/70 p-4"><p className="text-gray-500">Delivered</p><p className="mt-1 text-2xl font-bold">{report?.deliveredOrders || 0}</p></div><div className="rounded-2xl bg-white/70 p-4"><p className="text-gray-500">Returned</p><p className="mt-1 text-2xl font-bold">{report?.returnedOrders || 0}</p></div><div className="rounded-2xl bg-white/70 p-4"><p className="text-gray-500">Cancelled</p><p className="mt-1 text-2xl font-bold">{report?.cancelledOrders || 0}</p></div></div></div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-xl font-bold">Recent orders</h3><p className="mt-1 text-sm text-gray-500">Update delivery and return status here.</p></div><button onClick={() => void loadDashboard()} className="text-sm font-semibold text-[#4f6f52]">Refresh ↻</button></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b text-sm text-gray-400"><th className="pb-4 font-medium">Product</th><th className="pb-4 font-medium">Customer</th><th className="pb-4 font-medium">Amount</th><th className="pb-4 font-medium">Date</th><th className="pb-4 font-medium">Status</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading your records…</td></tr> : orders.length ? orders.slice(0, 10).map((order) => <tr key={order.id} className="border-b last:border-0"><td className="py-5 font-medium">{order.orderItems?.[0]?.product?.name || "—"}{(order.orderItems?.[0]?.quantity || 1) > 1 && <span className="ml-2 text-xs text-gray-400">×{order.orderItems?.[0]?.quantity}</span>}</td><td className="py-5 text-gray-500">{order.customerName}</td><td className="py-5 font-semibold">{taka(order.totalPrice)}</td><td className="py-5 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-BD")}</td><td className="py-5"><select value={order.status} onChange={(event) => void updateStatus(order.id, event.target.value)} className="rounded-full bg-[#eef3eb] px-3 py-1 text-xs font-semibold capitalize text-[#4f6f52] outline-none"><option value="confirmed">Confirmed</option><option value="delivered">Delivered</option><option value="returned">Returned</option><option value="cancelled">Cancelled</option></select></td></tr>) : <tr><td colSpan={5} className="py-8 text-center text-gray-500">No confirmed orders yet. Add one by voice or paste a chat.</td></tr>}</tbody></table></div></section>
      </div>
    </main>
  );
}
