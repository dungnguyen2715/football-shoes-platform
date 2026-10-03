import { useMemo, useState } from "react";
import { ClipboardList, Clock3, Search, ShoppingBag, Wallet } from "lucide-react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getAdminOrders } from "@/features/orders/orders.service";
import { formatAUD } from "@/features/products/products.service";
import type { AdminOrder, OrderStatus } from "@/types";

type OrderFilter = "all" | OrderStatus;

const orderStatuses: OrderStatus[] = [
  "Pending",
  "Contacted",
  "Confirmed",
  "Completed",
  "Cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>(getAdminOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        `${order.id} ${order.customer} ${order.contact} ${order.channel}`
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesSearch && (statusFilter === "all" || order.status === statusFilter);
    });
  }, [orders, search, statusFilter]);

  const pendingCount = orders.filter((order) => order.status === "Pending").length;
  const confirmedCount = orders.filter(
    (order) => order.status === "Confirmed" || order.status === "Completed",
  ).length;
  const orderValue = orders.reduce((sum, order) => sum + order.total, 0);

  const updateStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order,
      ),
    );
    toast.success("Order status updated in this preview");
  };

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Fulfillment"
        title="Orders"
        description="Review purchase requests and follow up with customers through their preferred channel."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Order requests"
          value={`${orders.length}`}
          detail="All mock requests"
          icon={ShoppingBag}
        />
        <AdminMetricCard
          label="Needs contact"
          value={`${pendingCount}`}
          detail="Pending a first reply"
          icon={Clock3}
        />
        <AdminMetricCard
          label="Confirmed"
          value={`${confirmedCount}`}
          detail="Confirmed or completed"
          icon={ClipboardList}
        />
        <AdminMetricCard
          label="Request value"
          value={formatAUD(orderValue)}
          detail="Combined order totals"
          icon={Wallet}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold">All order requests</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredOrders.length} request{filteredOrders.length === 1 ? "" : "s"} shown
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 pl-9"
                aria-label="Search orders"
                placeholder="Order, customer, channel…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderFilter)}
            >
              <SelectTrigger aria-label="Filter orders by status" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {orderStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact channel</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold">{order.id}</TableCell>
                  <TableCell>
                    <p className="font-semibold">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.contact}</p>
                  </TableCell>
                  <TableCell>{order.channel}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-semibold">{formatAUD(order.total)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateStatus(order.id, value as OrderStatus)}
                    >
                      <SelectTrigger
                        aria-label={`Update status for ${order.id}`}
                        className="h-8 w-36 border-0 bg-transparent px-0 shadow-none focus:ring-0"
                      >
                        <AdminStatusPill status={order.status} />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-sm text-muted-foreground">
                    No orders match this search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog
        open={selectedOrder !== null}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Order request details</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="mt-1 font-semibold">{selectedOrder.customer}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="mt-1 font-semibold">{selectedOrder.contact}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Preferred channel</dt>
                <dd className="mt-1 font-semibold">{selectedOrder.channel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Request date</dt>
                <dd className="mt-1 font-semibold">{selectedOrder.date}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Items</dt>
                <dd className="mt-1 font-semibold">{selectedOrder.items}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="mt-1 font-semibold">{formatAUD(selectedOrder.total)}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
