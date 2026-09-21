import type { Customer } from "@/types/customer";
import type { Order } from "@/types/order";

export const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`;

export const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Orders come back from the API with the customer populated (or null if the
// customer was deleted). This narrows it to a Customer safely.
export const getOrderCustomer = (order: Order): Customer | null =>
  order.customer_id && typeof order.customer_id === "object"
    ? order.customer_id
    : null;

export const orderStatusStyles: Record<Order["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  partial: "bg-blue-50 text-blue-700",
};
