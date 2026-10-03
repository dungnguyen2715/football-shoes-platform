import type { AdminOrder, RevenueEntry } from "@/types";

export const adminOrders: AdminOrder[] = [
  {
    id: "BY-2041",
    customer: "Liam O'Connell",
    contact: "+61 412 883 210",
    channel: "WhatsApp",
    items: 1,
    total: 289,
    status: "Pending",
    date: "2026-07-29",
  },
  {
    id: "BY-2040",
    customer: "Ava Nguyen",
    contact: "ava.n@email.com",
    channel: "Instagram",
    items: 2,
    total: 505,
    status: "Contacted",
    date: "2026-07-28",
  },
  {
    id: "BY-2039",
    customer: "Daniel Kerr",
    contact: "+61 401 224 907",
    channel: "Messenger",
    items: 1,
    total: 245,
    status: "Confirmed",
    date: "2026-07-28",
  },
  {
    id: "BY-2038",
    customer: "Sofia Marchetti",
    contact: "sofia.m@email.com",
    channel: "Email",
    items: 1,
    total: 175,
    status: "Completed",
    date: "2026-07-26",
  },
  {
    id: "BY-2037",
    customer: "Tom Whitfield",
    contact: "+61 433 118 002",
    channel: "Zalo",
    items: 1,
    total: 95,
    status: "Cancelled",
    date: "2026-07-25",
  },
];

export const revenueSeries: RevenueEntry[] = [
  { month: "Feb", revenue: 4200, orders: 18 },
  { month: "Mar", revenue: 5100, orders: 22 },
  { month: "Apr", revenue: 4800, orders: 20 },
  { month: "May", revenue: 6400, orders: 27 },
  { month: "Jun", revenue: 7900, orders: 33 },
  { month: "Jul", revenue: 9350, orders: 39 },
];
