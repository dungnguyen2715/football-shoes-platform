import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="display-xl text-2xl">Bootyard</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Australia's home for authenticated pre-owned football boots. Every pair inspected,
            graded and photographed in Melbourne.
          </p>
          <div className="flex gap-2">
            {[Instagram, Facebook, MessageCircle, Phone].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label={["Instagram", "Facebook", "WhatsApp", "Phone"][i]}
                className="grid size-11 place-items-center rounded-full border transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <p className="eyebrow">Shop</p>
          <Link to="/shop" className="block text-muted-foreground hover:text-foreground">All boots</Link>
          <Link to="/shop" className="block text-muted-foreground hover:text-foreground">New arrivals</Link>
          <Link to="/shop" className="block text-muted-foreground hover:text-foreground">Under $200</Link>
          <Link to="/wishlist" className="block text-muted-foreground hover:text-foreground">Wishlist</Link>
        </div>

        <div className="space-y-3 text-sm">
          <p className="eyebrow">Support</p>
          <span className="block text-muted-foreground">Condition guide</span>
          <span className="block text-muted-foreground">Shipping across AU</span>
          <span className="block text-muted-foreground">Returns</span>
          <span className="block text-muted-foreground">Sell your boots</span>
        </div>

        <div className="space-y-3">
          <p className="eyebrow">Drop alerts</p>
          <p className="text-sm text-muted-foreground">One email a week. New pairs only.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input aria-label="Email address" type="email" placeholder="you@email.com" className="h-11" />
            <Button type="submit" className="h-11 shrink-0">Join</Button>
          </form>
        </div>
      </div>
      <div className="border-t px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Bootyard. Prices in AUD. No online payment — we contact you to finalise every order.
      </div>
    </footer>
  );
}
