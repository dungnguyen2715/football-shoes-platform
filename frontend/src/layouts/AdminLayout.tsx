import {
  ArrowLeft,
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";

const adminNavigation = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Products", to: "/admin/products", icon: Package },
  { label: "Orders", to: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", to: "/admin/customers", icon: Users },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", to: "/admin/settings", icon: Settings },
] as const;

function AdminNavLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label="Admin navigation"
      className={mobile ? "flex min-w-max gap-1 px-3 py-2" : "mt-5 space-y-1"}
    >
      {adminNavigation.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/admin"}
          className={({ isActive }) =>
            `${mobile ? "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs" : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm"} font-semibold transition-colors ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  return (
    <div className="min-h-dvh w-full bg-surface">
      <div className="grid min-h-dvh w-full lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r bg-sidebar p-4 text-sidebar-foreground lg:flex lg:flex-col">
          <Link to="/admin" className="display-xl px-2 py-4 text-lg">
            Bootyard
          </Link>
          <AdminNavLinks />
          <Button
            asChild
            variant="ghost"
            className="mt-auto w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" /> Back to store
            </Link>
          </Button>
        </aside>

        <div className="min-w-0">
          <div className="sticky top-0 z-30 border-b bg-sidebar text-sidebar-foreground lg:hidden">
            <div className="flex items-center justify-between px-4 pt-3">
              <Link to="/admin" className="display-xl text-base">
                Bootyard
              </Link>
              <Link to="/" className="text-xs font-semibold text-muted-foreground">
                Storefront
              </Link>
            </div>
            <div className="overflow-x-auto">
              <AdminNavLinks mobile />
            </div>
          </div>
          <main className="min-w-0 p-4 sm:p-6 xl:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
