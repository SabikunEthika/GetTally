const stats = [
  {
    title: "Total Sales",
    value: "৳24,500",
    change: "+12.5%",
  },
  {
    title: "Net Earnings",
    value: "৳8,420",
    change: "+8.2%",
  },
  {
    title: "Orders",
    value: "47",
    change: "+6 this month",
  },
  {
    title: "Returns",
    value: "3",
    change: "6.4% of orders",
  },
];

const recentOrders = [
  {
    product: "Printed Kurti",
    customer: "Rima",
    amount: "৳1,250",
    status: "Delivered",
  },
  {
    product: "Cotton Hijab",
    customer: "Nusrat",
    amount: "৳650",
    status: "Confirmed",
  },
  {
    product: "Handmade Bag",
    customer: "Sadia",
    amount: "৳1,800",
    status: "Processing",
  },
  {
    product: "Linen Three-Piece",
    customer: "Mim",
    amount: "৳2,400",
    status: "Delivered",
  },
];

export default function Home() {
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

          <button className="rounded-full bg-[#20231f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4f6f52]">
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
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-3xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{stat.title}</p>

              <p className="mt-3 text-3xl font-bold">
                {stat.value}
              </p>

              <p className="mt-2 text-sm text-[#4f6f52]">
                {stat.change}
              </p>
            </div>
          ))}
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

            <button className="mt-8 w-full rounded-2xl bg-white px-5 py-4 font-semibold text-[#20231f] transition hover:bg-[#dfe8dc]">
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
                {recentOrders.map((order) => (
                  <tr
                    key={`${order.customer}-${order.product}`}
                    className="border-b last:border-0"
                  >
                    <td className="py-5 font-medium">
                      {order.product}
                    </td>

                    <td className="py-5 text-gray-500">
                      {order.customer}
                    </td>

                    <td className="py-5 font-semibold">
                      {order.amount}
                    </td>

                    <td className="py-5">
                      <span className="rounded-full bg-[#eef3eb] px-3 py-1 text-xs font-semibold text-[#4f6f52]">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}