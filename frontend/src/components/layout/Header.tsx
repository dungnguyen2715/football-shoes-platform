import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, Heart, User, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useShop } from "@/store/shop";

const nav = [
  { label: "Shop all", to: "/shop" },
  { label: "Brands", to: "/shop", search: undefined },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Account", to: "/account" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="min-h-11 min-w-11 rounded-full"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function Header() {
  const cartCount = useShop((s) => s.cart.length);
  const wishCount = useShop((s) => s.wishlist.length);

  return (
    <header className="sticky top-0 z-50 border-b glass">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="min-h-11 min-w-11 lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="mt-10 flex flex-col gap-1 px-4">
                {nav.map((n) => (
                  <Link
                    key={n.label}
                    to={n.to}
                    className="rounded-xl px-3 py-3 text-lg font-bold tracking-tight hover:bg-surface"
                  >
                    {n.label}
                  </Link>
                ))}
                <Link to="/admin" className="rounded-xl px-3 py-3 text-lg font-bold tracking-tight hover:bg-surface">
                  Admin
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground font-black">
              B
            </span>
            <span className="display-xl text-lg">Bootyard</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-6 lg:flex">
            {nav.slice(0, 2).map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/admin"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Admin
            </Link>
          </nav>
        </div>

        <div className="hidden min-w-0 md:block">
          <div className="relative mx-auto max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search boots"
              placeholder="Search Mercurial, Copa, size 9…"
              className="h-11 rounded-full pl-9"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="hidden min-h-11 min-w-11 rounded-full sm:inline-flex">
            <Link to="/wishlist" aria-label={`Wishlist, ${wishCount} items`}>
              <span className="relative">
                <Heart className="size-4" />
                {wishCount > 0 && (
                  <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {wishCount}
                  </span>
                )}
              </span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="hidden min-h-11 min-w-11 rounded-full sm:inline-flex">
            <Link to="/account" aria-label="Account">
              <User className="size-4" />
            </Link>
          </Button>
          <Button asChild size="sm" className="min-h-11 rounded-full px-4">
            <Link to="/cart" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingBag className="size-4" />
              <span className="ml-1 text-xs font-bold">{cartCount}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
