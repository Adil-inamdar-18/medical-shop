import type { Customer } from "./customer";
import type { Medicine } from "./medicine";

// Order status
export type OrderStatus = "pending" | "confirmed" | "partial";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "partial",
];

// Payment status
export const PAYMENT_STATUSES = ["pending", "confirmed", "partial"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderItem {
  _id?: string;

  // The API populates this with the full medicine document
  // when listing orders.
  medicine_id: Medicine | string | null;

  medicine_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  order_number: string;

  // The API populates this with the full customer document
  // when listing orders.
  // It is null if the customer has since been deleted.
  customer_id: Customer | string | null;

  items: OrderItem[];

  // Amount calculations
  subtotal: number;
  gst_percentage: number;
  gst_amount: number;
  total_amount: number;

  // Order status
  status: OrderStatus;

  // Payment status
  payment_status: PaymentStatus;

  // Payment amounts
  amount_paid: number;
  remaining_amount: number;

  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface OrderInput {
  customer_id: string;

  items: {
    medicine_id: string;
    medicine_name: string;
    quantity: number;
    price: number;
  }[];

  // Payment status when creating an order
  payment_status?: PaymentStatus;

  // Amount paid when creating an order
  amount_paid?: number;

  notes?: string;
}
