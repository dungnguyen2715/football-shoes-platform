import { useMemo, useState } from "react";
import { Mail, MapPin, Search, ShoppingBag, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusPill,
} from "@/features/admin/components/AdminUI";
import { getCustomers } from "@/features/customers/customers.service";
import { formatAUD } from "@/features/products/products.service";
import type { AdminCustomer } from "@/types";

export default function AdminCustomers() {
  const customers = useMemo(getCustomers, []);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return customers.filter((customer) =>
      `${customer.name} ${customer.email} ${customer.phone} ${customer.location}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [customers, search]);

  const totalOrders = customers.reduce((sum, customer) => sum + customer.orders, 0);
  const totalSpent = customers.reduce((sum, customer) => sum + customer.spent, 0);
  const customersWithEmail = customers.filter((customer) => customer.email !== "—").length;

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Relationships"
        title="Customers"
        description="Customer records are assembled from the storefront profile and current mock order requests."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Customer records"
          value={`${customers.length}`}
          detail="Storefront and order contacts"
          icon={Users}
        />
        <AdminMetricCard
          label="Order requests"
          value={`${totalOrders}`}
          detail="Across listed customers"
          icon={ShoppingBag}
        />
        <AdminMetricCard
          label="Contactable by email"
          value={`${customersWithEmail}`}
          detail="Email addresses on file"
          icon={Mail}
        />
        <AdminMetricCard
          label="Order value"
          value={formatAUD(totalSpent)}
          detail="Combined request totals"
          icon={Wallet}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold">Customer directory</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredCustomers.length} customer{filteredCustomers.length === 1 ? "" : "s"} shown
            </p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search customers"
              className="h-10 pl-9"
              placeholder="Name, email or phone…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total spent</TableHead>
                <TableHead>Last order</TableHead>
                <TableHead>Record</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.email !== "—" ? customer.email : customer.phone}
                    </p>
                  </TableCell>
                  <TableCell>{customer.location}</TableCell>
                  <TableCell>{customer.orders}</TableCell>
                  <TableCell className="font-semibold">{formatAUD(customer.spent)}</TableCell>
                  <TableCell>{customer.lastOrder}</TableCell>
                  <TableCell>
                    <AdminStatusPill status={customer.orders > 0 ? "Active" : "Inactive"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(customer)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                    No customer records match this search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog
        open={selectedCustomer !== null}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
            <DialogDescription>Customer contact and order summary</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="mt-1 break-words font-semibold">{selectedCustomer.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="mt-1 font-semibold">{selectedCustomer.phone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Instagram</dt>
                  <dd className="mt-1 font-semibold">{selectedCustomer.instagram}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd className="mt-1 font-semibold">{selectedCustomer.whatsapp}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Zalo</dt>
                  <dd className="mt-1 font-semibold">{selectedCustomer.zalo}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Orders / spent</dt>
                  <dd className="mt-1 font-semibold">
                    {selectedCustomer.orders} · {formatAUD(selectedCustomer.spent)}
                  </dd>
                </div>
              </dl>
              <p className="flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {selectedCustomer.location}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
