export type OrderStatus = "Pending" | "Contacted" | "Confirmed" | "Completed" | "Cancelled";

export interface AdminOrder {
  id: string;
  customer: string;
  contact: string;
  channel: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
}

export interface RevenueEntry {
  month: string;
  revenue: number;
  orders: number;
}
