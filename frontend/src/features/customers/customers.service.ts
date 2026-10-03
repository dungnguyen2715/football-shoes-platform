import { getAdminOrders } from "@/features/orders/orders.service";
import { storefrontCustomer } from "./data/mock-customers";
import type { AdminCustomer } from "@/types";

/** Builds the admin customer list from the current order and storefront account mock data. */
export const getCustomers = (): AdminCustomer[] => {
  const customersByName = new Map<string, AdminCustomer>();

  customersByName.set(storefrontCustomer.name.toLocaleLowerCase(), {
    ...storefrontCustomer,
    id: "customer-alex-turner",
    orders: 0,
    spent: 0,
    lastOrder: "—",
  });

  for (const order of getAdminOrders()) {
    const key = order.customer.toLocaleLowerCase();
    const email = order.contact.includes("@") ? order.contact : "—";
    const phone = order.contact.includes("@") ? "—" : order.contact;
    const existing = customersByName.get(key);

    if (existing) {
      existing.orders += 1;
      existing.spent += order.total;
      existing.lastOrder = order.date > existing.lastOrder ? order.date : existing.lastOrder;
      continue;
    }

    customersByName.set(key, {
      id: `customer-${order.id.toLowerCase()}`,
      name: order.customer,
      email,
      phone,
      instagram: "—",
      whatsapp: order.channel === "WhatsApp" ? phone : "—",
      zalo: order.channel === "Zalo" ? phone : "—",
      location: "—",
      orders: 1,
      spent: order.total,
      lastOrder: order.date,
    });
  }

  return [...customersByName.values()];
};
