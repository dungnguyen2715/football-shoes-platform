import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eye, Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminMetricCard, AdminPageHeader, AdminPanel } from "@/features/admin/components/AdminUI";
import { getRevenueSeries } from "@/features/orders/orders.service";
import { formatAUD, getProducts, surfaceLabel } from "@/features/products/products.service";
import type { Surface } from "@/types";

export default function AdminAnalytics() {
  const revenueSeries = getRevenueSeries();
  const products = getProducts();
  const totalRevenue = revenueSeries.reduce((sum, month) => sum + month.revenue, 0);
  const totalOrders = revenueSeries.reduce((sum, month) => sum + month.orders, 0);
  const totalViews = products.reduce((sum, product) => sum + product.views, 0);
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const surfaceCounts = products.reduce<Record<Surface, number>>(
    (counts, product) => ({ ...counts, [product.surface]: counts[product.surface] + 1 }),
    { FG: 0, SG: 0, AG: 0, TF: 0, IC: 0 },
  );
  const topProducts = [...products].sort((first, second) => second.views - first.views).slice(0, 5);

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Performance"
        title="Analytics"
        description="A snapshot of revenue, order activity and customer interest across the current mock catalog."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Revenue"
          value={formatAUD(totalRevenue)}
          detail="Last 6 months"
          icon={Wallet}
        />
        <AdminMetricCard
          label="Orders"
          value={`${totalOrders}`}
          detail="Across the same period"
          icon={ShoppingBag}
        />
        <AdminMetricCard
          label="Avg. order value"
          value={formatAUD(averageOrderValue)}
          detail="Revenue divided by orders"
          icon={TrendingUp}
        />
        <AdminMetricCard
          label="Product views"
          value={totalViews.toLocaleString("en-AU")}
          detail="Views recorded in the catalog"
          icon={Eye}
        />
      </div>

      <div className="grid min-w-0 gap-5 2xl:grid-cols-2">
        <AdminPanel title="Revenue trend" description="Monthly revenue in Australian dollars">
          <div className="h-80 min-w-0 p-4 sm:p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}
                />
                <Tooltip formatter={(value) => formatAUD(Number(value))} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel title="Order trend" description="Requests received each month">
          <div className="h-80 min-w-0 p-4 sm:p-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip />
                <Line
                  dataKey="orders"
                  name="Orders"
                  type="monotone"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--chart-1)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <AdminPanel title="Most viewed products" description="Ranked by catalog views">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex min-w-52 items-center gap-3">
                        <img
                          src={product.images[0]}
                          alt=""
                          loading="lazy"
                          className="size-10 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatAUD(product.price)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{product.availability}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {product.views.toLocaleString("en-AU")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminPanel>

        <AdminPanel title="Inventory by surface" description="Current storefront catalog">
          <div className="space-y-5 p-5">
            {Object.entries(surfaceCounts).map(([surface, count]) => {
              const percentage = products.length ? Math.round((count / products.length) * 100) : 0;
              return (
                <div key={surface}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">
                      {surface}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {surfaceLabel[surface as Surface]}
                      </span>
                    </span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
              <Package className="size-4" /> {products.length} pairs in the current catalog
            </p>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
