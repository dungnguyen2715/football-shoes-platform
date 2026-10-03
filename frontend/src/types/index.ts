// Export all shared types/interfaces here

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type { AdminOrder, OrderStatus, RevenueEntry } from "./order";
export type { AdminCustomer, CustomerProfile } from "./customer";
export type { Availability, Product, Review, Surface } from "./product";
