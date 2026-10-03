import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/utils/cn";
import { formatAUD } from "@/features/products/products.service";
import type { Product } from "@/types";
import { useShop } from "@/store/shop";

interface Props {
  product: Product;
  variant?: "default" | "compact";
  className?: string;
}

export function ProductCard({ product, variant = "default", className }: Props) {
  const wishlist = useShop((s) => s.wishlist);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const saved = wishlist.includes(product.id);
  const discount = Math.round((1 - product.price / product.retailPrice) * 100);

  return (
    <article
      className={cn(
        "group card-lift relative overflow-hidden rounded-2xl border bg-card shadow-card",
        className,
      )}
    >
      <Link
        to={`/product/${product.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-square overflow-hidden bg-surface">
          <img
            src={product.images[0]}
            alt={`${product.name} in ${product.colorway}`}
            loading="lazy"
            width={900}
            height={900}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.availability === "sold" && (
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                Sold
              </span>
            )}
            {product.availability === "reserved" && (
              <span className="rounded-full bg-warning px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-warning-foreground">
                Reserved
              </span>
            )}
            {product.availability === "available" && discount > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                -{discount}%
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label={
          saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
        }
        aria-pressed={saved}
        onClick={() => {
          toggleWishlist(product.id);
          toast(saved ? "Removed from wishlist" : "Saved to wishlist");
        }}
        className="absolute right-3 top-3 grid size-11 place-items-center rounded-full glass border transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Heart className={cn("size-4", saved && "fill-current text-accent")} />
      </button>

      <div className={cn("space-y-2 p-4", variant === "compact" && "p-3")}>
        <div className="flex items-center gap-2">
          <span className="eyebrow">{product.brand}</span>
          <span className="text-[11px] text-muted-foreground">· {product.size}</span>
        </div>
        <h3 className="truncate text-base font-bold leading-tight">{product.model}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-surface px-2 py-0.5 font-semibold text-foreground">
            {product.condition}/10
          </span>
          <span>{product.conditionLabel}</span>
          <span>· {product.surface}</span>
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-extrabold tracking-tight">{formatAUD(product.price)}</span>
          <span className="text-xs text-muted-foreground line-through">
            {formatAUD(product.retailPrice)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
