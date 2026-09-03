import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { getProduct } from "@/lib/products";
import { useShop } from "@/store/shop";

export default function Wishlist() {
  const wishlist = useShop((s) => s.wishlist);
  const items = wishlist.map((id) => getProduct(id)!).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Wishlist</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {items.length} saved pair{items.length === 1 ? "" : "s"}
      </p>

      {items.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-3xl border border-dashed py-24 text-center">
          <Heart className="size-6 text-muted-foreground" />
          <p className="mt-4 text-lg font-bold">Nothing saved yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tap the heart on any pair to keep an eye on it.
          </p>
          <Button asChild className="mt-6 min-h-12 rounded-full px-6">
            <Link to="/shop">Browse boots</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
