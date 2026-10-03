import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProductCard } from "@/components/product/ProductCard";
import { getAdminOrders } from "@/features/orders/orders.service";
import { storefrontCustomer } from "@/features/customers/data/mock-customers";
import { formatAUD, getProduct } from "@/features/products/products.service";
import { useShop } from "@/store/shop";
import type { AdminOrder } from "@/types";

const statusTone: Record<AdminOrder["status"], string> = {
  Pending: "bg-warning text-warning-foreground",
  Contacted: "bg-surface text-foreground",
  Confirmed: "bg-accent text-accent-foreground",
  Completed: "bg-success text-success-foreground",
  Cancelled: "bg-destructive text-destructive-foreground",
};

export default function Account() {
  const adminOrders = getAdminOrders();
  const wishlist = useShop((s) => s.wishlist);
  const saved = wishlist.flatMap((id) => {
    const product = getProduct(id);
    return product ? [product] : [];
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14 shrink-0">
            <AvatarFallback className="bg-accent font-black text-accent-foreground">
              AT
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              {storefrontCustomer.name}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {storefrontCustomer.email} · {storefrontCustomer.location}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="min-h-11 rounded-full">
          <Link to="/login">Sign out</Link>
        </Button>
      </header>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="no-scrollbar w-full justify-start overflow-x-auto">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6 space-y-3">
          {adminOrders.slice(0, 4).map((o) => (
            <div
              key={o.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-card p-5"
            >
              <div className="min-w-0">
                <p className="font-bold">{o.id}</p>
                <p className="text-xs text-muted-foreground">
                  {o.date} · {o.items} item{o.items > 1 ? "s" : ""} · contacted via {o.channel}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusTone[o.status]}`}
                >
                  {o.status}
                </span>
                <p className="mt-1 font-extrabold">{formatAUD(o.total)}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
          {saved.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              No saved boots yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {saved.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <form
            className="grid gap-4 rounded-2xl border bg-card p-6 sm:grid-cols-2"
            onSubmit={(e) => e.preventDefault()}
          >
            {[
              ["Full name", storefrontCustomer.name],
              ["Email", storefrontCustomer.email],
              ["Phone", storefrontCustomer.phone],
              ["Instagram", storefrontCustomer.instagram],
              ["WhatsApp", storefrontCustomer.whatsapp],
              ["Zalo", storefrontCustomer.zalo],
            ].map(([label, value]) => (
              <div key={label} className="space-y-2">
                <Label htmlFor={label}>{label}</Label>
                <Input id={label} defaultValue={value} className="h-11" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button className="min-h-11 rounded-full px-6">Save changes</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-3">
          {[
            ["Drop alerts", "Email me when new pairs land in my size"],
            ["Price drops", "Notify me when a saved pair is reduced"],
            ["SMS updates", "Order updates by text message"],
          ].map(([title, sub], i) => (
            <div
              key={title}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-card p-5"
            >
              <div className="min-w-0">
                <p className="font-bold">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <Switch defaultChecked={i < 2} aria-label={title} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
