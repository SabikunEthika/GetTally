"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch('http://localhost:3001/api/orders/stats/2');
        const statsData = await statsResponse.json();

        // Fetch recent orders
        const ordersResponse = await fetch('http://localhost:3001/api/orders/seller/2');
        const ordersData = await ordersResponse.json();

        if (statsData.success) {
          setStats(statsData.data);
        }
        if (ordersData.success) {
          setOrders(ordersData.data.slice(0, 4)); // Show last 4 orders
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#20231f]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Get<span className="text-[#4f6f52]">Tally</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Your business, at a glance.
            </p>
          </div>

          <button onClick={() => router.push('/voice')} className="rounded-full bg-[#20231f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4f6f52]">
            + Add Order
          </button>
        </header>

        {/* Welcome */}
        <section className="mt-10 rounded-3xl bg-[#dfe8dc] p-8">
          <p className="text-sm font-medium text-[#4f6f52]">
            Good evening 👋
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Here's how your business is doing.
          </h2>

          <p className="mt-3 max-w-xl text-gray-600">
            Keep track of your orders, earnings and returns without losing
            yourself in Messenger chats.
          </p>
        </section>

        {/* Statistics */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="mt-3 text-3xl font-bold">
              ৳{stats?.totalEarnings || 0}
            </p>
            <p className="mt-2 text-sm text-[#4f6f52]">
              {stats?.totalOrders || 0} orders
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Net Earnings</p>
            <p className="mt-3 text-3xl font-bold">
              ৳{stats?.totalEarnings || 0}
            </p>
            <p className="mt-2 text-sm text-[#4f6f52]">
              This month
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Orders</p>
            <p className="mt-3 text-3xl font-bold">
              {stats?.totalOrders || 0}
            </p>
            <p className="mt-2 text-sm text-[#4f6f52]">
              Confirmed
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Returns</p>
            <p className="mt-3 text-3xl font-bold">
              {stats?.returnedOrders || 0}
            </p>
            <p className="mt-2 text-sm text-[#4f6f52]">
              {stats?.totalOrders > 0 ? `${((stats?.returnedOrders / stats?.totalOrders) * 100).toFixed(1)}%` : '0%'}
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* Sales Overview */}
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Sales Overview</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Monthly sales performance
                </p>
              </div>

              <span className="rounded-full bg-[#eef3eb] px-4 py-2 text-sm font-medium text-[#4f6f52]">
                This Month
              </span>
            </div>

            {/* Simple visual chart */}
            <div className="mt-10 flex h-56 items-end justify-between gap-3">
              {[45, 65, 52, 80, 60, 92, 74].map((height, index) => (
                <div
                  key={index}
                  className="flex flex-1 flex-col items-center gap-3"
                >
                  <div
                    className="w-full max-w-10 rounded-t-xl bg-[#4f6f52] transition hover:bg-[#20231f]"
                    style={{ height: `${height}%` }}
                  />

                  <span className="text-xs text-gray-400">
                    {["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action */}
          <div className="rounded-3xl bg-[#20231f] p-7 text-white">
            <p className="text-sm text-gray-400">Quick Log</p>

            <h3 className="mt-3 text-2xl font-bold">
              Sold something outside Messenger?
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Use your voice to quickly record the order instead of typing
              everything manually.
            </p>

            <button onClick={() => router.push('/voice')} className="mt-8 w-full rounded-2xl bg-white px-5 py-4 font-semibold text-[#20231f] transition hover:bg-[#dfe8dc]">
              🎙 Log by Voice
            </button>
          </div>
        </section>

        {/* Recent Orders */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Recent Orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your latest confirmed orders
              </p>
            </div>

            <button className="text-sm font-semibold text-[#4f6f52]">
              View all →
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-150 text-left">
              <thead>
                <tr className="border-b text-sm text-gray-400">
                  <th className="pb-4 font-medium">Product</th>
                  <th className="pb-4 font-medium">Customer</th>
                  <th className="pb-4 font-medium">Amount</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-5 text-center text-gray-500">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-5 font-medium">
                        {order.orderItems?.[0]?.product?.name || 'N/A'}
                      </td>

                      <td className="py-5 text-gray-500">
                        {order.customerName}
                      </td>

                      <td className="py-5 font-semibold">
                        ৳{order.totalPrice}
                      </td>

                      <td className="py-5">
                        <span className="rounded-full bg-[#eef3eb] px-3 py-1 text-xs font-semibold text-[#4f6f52]">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-5 text-center text-gray-500">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}