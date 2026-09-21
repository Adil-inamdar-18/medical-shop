import type { Customer } from "./customer";
import type { Medicine } from "./medicine";

// Must match the backend order schema enum: ["pending", "confirmed", "partial"]
export type OrderStatus = "pending" | "confirmed" | "partial";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "partial"];

export interface OrderItem {
  _id?: string;
  // The API populates this with the full medicine document when listing orders
  medicine_id: Medicine | string | null;
  medicine_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  order_number: string;
  // The API populates this with the full customer document when listing orders.
  // It is null if the customer has since been deleted.
  customer_id: Customer | string | null;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
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
  notes?: string;
}
