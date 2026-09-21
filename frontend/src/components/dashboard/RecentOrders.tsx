import { ArrowUpRight } from "lucide-react";

import { EmptyBlock, LoadingBlock } from "@/components/ui/Feedback";
import {
  formatCurrency,
  formatDate,
  getOrderCustomer,
  orderStatusStyles,
} from "@/lib/format";
import type { Order } from "@/types/order";

interface RecentOrdersProps {
  orders: Order[];
  loading?: boolean;
}

export default function RecentOrders({ orders, loading }: RecentOrdersProps) {
  const recent = orders.slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest orders from your customers
          </p>
        </div>

        <a
          href="/orders"
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View all
          <ArrowUpRight size={16} />
        </a>
      </div>

      {loading && recent.length === 0 ? (
        <LoadingBlock label="Loading orders..." />
      ) : recent.length === 0 ? (
        <EmptyBlock message="No orders yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {["Order", "Customer", "Items", "Amount", "Status"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {recent.map((order) => {
                const customer = getOrderCustomer(order);

                return (
                  <tr
                    key={order._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {order.order_number}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {customer?.store_name ?? "Unknown"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {customer?.customer_name}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "medicine" : "medicines"}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(order.total_amount)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${orderStatusStyles[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
