import { getCustomers, getOrders } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type { Order } from "@/types/order";

export interface MonthlySales {
  label: string;
  total: number;
}

export interface DashboardData {
  customers: Customer[];
  orders: Order[];
  stats: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    totalOrders: number;
    ordersThisMonth: number;
    totalSales: number;
    salesThisMonth: number;
    pendingOrders: number;
  };
  sales: { 6: MonthlySales[]; 12: MonthlySales[] };
}

const sameMonth = (iso: string, now: Date) => {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

function monthlySales(orders: Order[], months: number, now: Date) {
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);

    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleDateString("en-US", { month: "short" }),
      total: 0,
    };
  });

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const bucket = buckets.find(
      (item) =>
        item.year === date.getFullYear() && item.month === date.getMonth(),
    );

    if (bucket) bucket.total += order.total_amount;
  }

  return buckets.map(({ label, total }) => ({ label, total }));
}

// Everything the dashboard needs, calculated from the live API data.
export async function loadDashboard(): Promise<DashboardData> {
  const [customers, orders] = await Promise.all([getCustomers(), getOrders()]);
  const now = new Date();

  return {
    customers,
    orders,
    stats: {
      totalCustomers: customers.length,
      newCustomersThisMonth: customers.filter((c) => sameMonth(c.createdAt, now))
        .length,
      totalOrders: orders.length,
      ordersThisMonth: orders.filter((o) => sameMonth(o.createdAt, now)).length,
      totalSales: orders.reduce((sum, o) => sum + o.total_amount, 0),
      salesThisMonth: orders
        .filter((o) => sameMonth(o.createdAt, now))
        .reduce((sum, o) => sum + o.total_amount, 0),
      pendingOrders: orders.filter((o) => o.status === "pending").length,
    },
    sales: {
      6: monthlySales(orders, 6, now),
      12: monthlySales(orders, 12, now),
    },
  };
}
