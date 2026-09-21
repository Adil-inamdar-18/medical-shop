import type { Customer } from "@/types/customer";
import type { Medicine, MedicineInput } from "@/types/medicine";
import type { Order, OrderInput, OrderStatus } from "@/types/order";
import type { AuthPayload, User, UserRole } from "@/types/user";

export type CustomerInput = Omit<Customer, "_id" | "createdAt" | "updatedAt">;

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

export class ApiError extends Error {}

// ---------- Auth token storage ----------
// The token is kept in localStorage (read by the API client) and mirrored
// into a plain cookie so the Next.js middleware can check it on navigation.
const TOKEN_KEY = "medical_shop_token";

export const getToken = (): string | null =>
  typeof window === "undefined"
    ? null
    : window.localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string | null) => {
  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax${secure}`;
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
    document.cookie = "token=; path=/; max-age=0";
  }
};

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    const token = getToken();

    response = await fetch(`${API_URL}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Make sure the backend is running.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | (ApiResponse<T> & { error?: string })
    | null;

  if (!response.ok || !body || body.success === false) {
    throw new ApiError(
      body?.error
        ? `${body.message ?? "Request failed"}: ${body.error}`
        : (body?.message ?? `Request failed (${response.status})`),
    );
  }

  return body.data;
}

const json = (method: string, payload: unknown): RequestInit => ({
  method,
  body: JSON.stringify(payload),
});

// ---------- Customers ----------
export const getCustomers = () => request<Customer[]>("/customers");

export const createCustomer = (input: CustomerInput) =>
  request<Customer>("/customers", json("POST", input));

export const updateCustomer = (id: string, input: Partial<CustomerInput>) =>
  request<Customer>(`/customers/${id}`, json("PUT", input));

export const deleteCustomer = (id: string) =>
  request<null>(`/customers/${id}`, { method: "DELETE" });

// ---------- Medicines ----------
export const getMedicines = () => request<Medicine[]>("/medicines");

export const createMedicine = (input: MedicineInput) =>
  request<Medicine>("/medicines", json("POST", input));

export const updateMedicine = (id: string, input: Partial<MedicineInput>) =>
  request<Medicine>(`/medicines/${id}`, json("PUT", input));

export const deleteMedicine = (id: string) =>
  request<null>(`/medicines/${id}`, { method: "DELETE" });

// Manual stock control - only used from the Admin Panel
export const setMedicineStock = (id: string, stock: number) =>
  request<Medicine>(`/medicines/${id}/stock`, json("PATCH", { stock }));

// ---------- Orders ----------
export const getOrders = () => request<Order[]>("/orders");

// Creating an order never changes medicine stock.
export const createOrder = (input: OrderInput) =>
  request<Order>("/orders", json("POST", input));

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  request<Order>(`/orders/${id}`, json("PUT", { status }));

export const deleteOrder = (id: string) =>
  request<null>(`/orders/${id}`, { method: "DELETE" });

// ---------- Auth ----------
export const registerUser = (input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}) => request<AuthPayload>("/auth/register", json("POST", input));

export const loginUser = (input: { email: string; password: string }) =>
  request<AuthPayload>("/auth/login", json("POST", input));

export const getCurrentUser = () => request<User>("/auth/me");

// ---------- Health ----------
export interface Health {
  server: string;
  database: string;
}

export async function getHealth(): Promise<Health> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/health`, { cache: "no-store" });
  } catch {
    throw new ApiError("Cannot reach the server.");
  }

  return response.json();
}
