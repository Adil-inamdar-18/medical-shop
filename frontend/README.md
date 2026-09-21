# Medical App – Frontend

Next.js (App Router) + Tailwind dashboard for the medical shop.

## Setup

```bash
npm install
cp .env.example .env.local      # already included with the default value
npm run dev                     # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` must point at the backend API (default `http://localhost:5000/api`).
Restart `npm run dev` after changing it.

## Pages

| Route        | What it does                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| `/`          | Live dashboard (stats, recent orders, sales chart) + **Add Customer** button |
| `/customers` | Customer list, search, add customer                                          |
| `/orders`    | Order list, search, create order                                             |
| `/admin`     | Admin panel: medicine inventory + **manual stock**, order status, customers  |

## Code layout

```
src/
  app/            pages (dashboard, customers, orders, admin)
  components/
    admin/        Medicines / Orders / Customers panels
    customers/    CustomerFormModal (add + edit)
    orders/       CreateOrderModal
    dashboard/    StatCard, RecentOrders
    layout/       Sidebar, Header, DashboardLayout
    ui/           Modal, Field, Feedback (loading / error / empty)
  lib/            api.ts (all backend calls), format.ts, dashboard.ts
  hooks/          useFetch.ts
  types/          Customer, Medicine, Order
```
