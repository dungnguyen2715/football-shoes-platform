import {
  adminOrders as mockAdminOrders,
  revenueSeries as mockRevenueSeries,
} from "./data/mock-orders";
import type { AdminOrder, RevenueEntry } from "@/types";

/** Mock-backed order access; replace these functions with API calls when the backend is available. */
export const getAdminOrders = (): AdminOrder[] => mockAdminOrders;

export const getRevenueSeries = (): RevenueEntry[] => mockRevenueSeries;
