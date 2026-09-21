"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
  SuccessBanner,
} from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import { deleteOrder, getOrders, updateOrderStatus } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  getOrderCustomer,
  orderStatusStyles,
} from "@/lib/format";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/types/order";

export default function OrdersPanel() {
  const { data, error, loading, reload } = useFetch(getOrders);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const orders = data ?? [];

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setBusyId(order._id);
    setActionError(null);

    try {
      await updateOrderStatus(order._id, status);
      showNotice(`${order.order_number} marked as ${status}.`);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (order: Order) => {
    if (!window.confirm(`Delete order ${order.order_number}? This cannot be undone.`))
      return;

    setBusyId(order._id);
    setActionError(null);

    try {
      await deleteOrder(order._id);
      showNotice(`${order.order_number} was deleted.`);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {notice && <SuccessBanner message={notice} />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {actionError && <ErrorBanner message={actionError} />}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && orders.length === 0 ? (
          <LoadingBlock label="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyBlock message="No orders yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Order", "Customer", "Items ordered", "Amount", "Status", ""].map(
                    (heading, index) => (
                      <th
                        key={index}
                        className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const customer = getOrderCustomer(order);

                  return (
                    <tr
                      key={order._id}
                      className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {order.order_number}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {customer?.store_name ?? "Deleted customer"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {customer?.customer_name}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <ul className="space-y-1 text-sm text-slate-600">
                          {order.items.map((item, index) => (
                            <li key={item._id ?? index}>
                              {item.medicine_name}{" "}
                              <span className="text-slate-400">
                                × {item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {formatCurrency(order.total_amount)}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          disabled={busyId === order._id}
                          onChange={(event) =>
                            changeStatus(order, event.target.value as OrderStatus)
                          }
                          aria-label={`Status of ${order.order_number}`}
                          className={`rounded-full border-0 px-3 py-1.5 text-xs font-medium capitalize outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60 ${orderStatusStyles[order.status]}`}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <button
                            aria-label={`Delete ${order.order_number}`}
                            disabled={busyId === order._id}
                            onClick={() => remove(order)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
