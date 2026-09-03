import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";

import { useShop } from "@/store/shop";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: Search },
  { to: "/wishlist", label: "Saved", icon: Heart },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/account", label: "Account", icon: User },
] as const;

export function MobileNav() {
  const cartCount = useShop((s) => s.cart.length);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t glass pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={label}>
            <Link
              to={to}
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: to === "/" }}
            >
              <span className="relative">
                <Icon className="size-5" />
                {label === "Cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                    {cartCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
