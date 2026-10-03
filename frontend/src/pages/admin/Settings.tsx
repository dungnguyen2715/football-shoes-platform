import { useState, type FormEvent } from "react";
import { Bell, CreditCard, Save, ShieldCheck, Store, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/AdminUI";
import { storefrontCustomer } from "@/features/customers/data/mock-customers";

export default function AdminSettings() {
  const [storeName, setStoreName] = useState("Bootyard");
  const [contactEmail, setContactEmail] = useState(storefrontCustomer.email);
  const [contactPhone, setContactPhone] = useState(storefrontCustomer.phone);
  const [instagram, setInstagram] = useState("@bootyard.au");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("300");
  const [shippingFee, setShippingFee] = useState("15");
  const [storeOpen, setStoreOpen] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Settings saved for this preview");
  };

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage storefront contact details, fulfillment defaults and admin notifications."
      />

      <form className="space-y-5" onSubmit={handleSave}>
        <AdminPanel
          title="Store profile"
          description="These details help customers recognize and contact your store."
        >
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-name" className="flex items-center gap-2">
                <Store className="size-4 text-muted-foreground" /> Store name
              </Label>
              <Input
                id="store-name"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email">Contact email</Label>
              <Input
                id="store-email"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Contact phone</Label>
              <Input
                id="store-phone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-instagram">Instagram</Label>
              <Input
                id="store-instagram"
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4 sm:col-span-2">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Store className="size-4 text-muted-foreground" /> Store is open
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Customers can browse and submit order requests.
                </p>
              </div>
              <Switch
                checked={storeOpen}
                onCheckedChange={setStoreOpen}
                aria-label="Store is open"
              />
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Fulfillment"
          description="Current storefront requests are manually confirmed; online payments are disabled."
        >
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="free-shipping" className="flex items-center gap-2">
                <Truck className="size-4 text-muted-foreground" /> Free shipping from (AUD)
              </Label>
              <Input
                id="free-shipping"
                type="number"
                min="0"
                value={freeShippingThreshold}
                onChange={(event) => setFreeShippingThreshold(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-fee">Standard shipping fee (AUD)</Label>
              <Input
                id="shipping-fee"
                type="number"
                min="0"
                value={shippingFee}
                onChange={(event) => setShippingFee(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-4 sm:col-span-2">
              <CreditCard className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Payment collection</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No payment is taken online. The owner arranges payment after contacting the
                  customer.
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                Manual
              </span>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Notifications"
          description="Choose which updates appear in your admin workflow."
        >
          <div className="divide-y">
            {[
              {
                id: "order-alerts",
                title: "New order requests",
                detail: "Notify me when a customer submits a request.",
                icon: Bell,
                checked: orderAlerts,
                onCheckedChange: setOrderAlerts,
              },
              {
                id: "inventory-alerts",
                title: "Inventory changes",
                detail: "Show reminders when listings are reserved or sold.",
                icon: Store,
                checked: inventoryAlerts,
                onCheckedChange: setInventoryAlerts,
              },
              {
                id: "weekly-summary",
                title: "Weekly summary",
                detail: "Receive a weekly overview of store activity.",
                icon: ShieldCheck,
                checked: weeklySummary,
                onCheckedChange: setWeeklySummary,
              },
            ].map(({ id, title, detail, icon: Icon, checked, onCheckedChange }) => (
              <div key={id} className="flex items-center gap-4 p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <Label htmlFor={id} className="font-semibold">
                    {title}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                </div>
                <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
              </div>
            ))}
          </div>
        </AdminPanel>

        <div className="flex justify-end">
          <Button type="submit" className="min-h-11 rounded-full px-6">
            <Save className="mr-2 size-4" /> Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
