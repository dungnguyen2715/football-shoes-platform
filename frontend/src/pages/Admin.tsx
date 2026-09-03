import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminOrders, formatAUD, products, revenueSeries } from "@/lib/products";

const statusTone: Record<string, string> = {
  Pending: "bg-warning text-warning-foreground",
  Contacted: "bg-surface text-foreground",
  Confirmed: "bg-accent text-accent-foreground",
  Completed: "bg-success text-success-foreground",
  Cancelled: "bg-destructive text-destructive-foreground",
};

export default function Admin() {
  const sold = products.filter((p) => p.availability === "sold").length;
  const pending = adminOrders.filter((o) => o.status === "Pending").length;

  const nav = [
    ["Overview", LayoutDashboard],
    ["Products", Package],
    ["Orders", ShoppingCart],
    ["Customers", Users],
    ["Analytics", BarChart3],
    ["Settings", Settings],
  ] as const;

  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r bg-sidebar p-4 text-sidebar-foreground lg:block">
          <p className="display-xl px-2 py-4 text-lg">Bootyard</p>
          <nav className="mt-4 space-y-1">
            {nav.map(([label, Icon]) => (
              <span
                key={label}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-sidebar-accent"
              >
                <Icon className="size-4" /> {label}
              </span>
            ))}
          </nav>
          <Button
            asChild
            variant="ghost"
            className="mt-8 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" /> Back to store
            </Link>
          </Button>
        </aside>

        <main className="p-4 sm:p-8">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="eyebrow">Dashboard</p>
              <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
                Good morning, Owner
              </h1>
            </div>
            <Button className="min-h-11 rounded-full">Add product</Button>
          </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Revenue (Jul)", formatAUD(9350), "+18% vs Jun"],
              ["Pairs sold", `${sold + 37}`, "39 orders"],
              ["Pending orders", `${pending}`, "Awaiting contact"],
              [
                "Live inventory",
                `${products.filter((p) => p.availability === "available").length}`,
                "One-of-one pairs",
              ],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-2xl border bg-card p-5 shadow-card">
                <p className="eyebrow">{label}</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="orders" className="mt-8">
            <TabsList className="no-scrollbar w-full justify-start overflow-x-auto">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-4 overflow-x-auto rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-bold">{o.id}</TableCell>
                      <TableCell>
                        <p className="font-semibold">{o.customer}</p>
                        <p className="text-xs text-muted-foreground">{o.contact}</p>
                      </TableCell>
                      <TableCell>{o.channel}</TableCell>
                      <TableCell>{formatAUD(o.total)}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusTone[o.status]}`}
                        >
                          {o.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent
              value="inventory"
              className="mt-4 overflow-x-auto rounded-2xl border bg-card"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 8).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt=""
                            loading="lazy"
                            className="size-10 rounded-lg object-cover"
                          />
                          <span className="font-semibold">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{p.size}</TableCell>
                      <TableCell>{p.condition}/10</TableCell>
                      <TableCell>{formatAUD(p.price)}</TableCell>
                      <TableCell className="capitalize">{p.availability}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4 rounded-2xl border bg-card p-5">
              <p className="eyebrow">Revenue, last 6 months</p>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
