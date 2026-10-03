import { Link, useParams, Navigate } from "react-router-dom";
import { Heart, Share2, ShoppingBag, Check, Truck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/utils/cn";
import {
  formatAUD,
  getProduct,
  getProducts,
  surfaceLabel,
} from "@/features/products/products.service";
import { useShop } from "@/store/shop";

export default function ProductDetail() {
  const { productId } = useParams();
  const product = getProduct(productId);

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const addToCart = useShop((s) => s.addToCart);
  const wishlist = useShop((s) => s.wishlist);
  const toggleWishlist = useShop((s) => s.toggleWishlist);

  if (!product) {
    return <Navigate to="/404" replace />;
  }
  const saved = wishlist.includes(product.id);
  const sold = product.availability !== "available";
  const discount = Math.round((1 - product.price / product.retailPrice) * 100);

  const related = getProducts()
    .filter((p) => p.id !== product.id && p.brand === product.brand)
    .slice(0, 4);

  const specs: Array<[string, string]> = [
    ["Brand", product.brand],
    ["Model", product.model],
    ["Size", product.size],
    ["Colourway", product.colorway],
    ["Surface", `${product.surface} — ${surfaceLabel[product.surface]}`],
    ["Stud type", product.studType],
    ["Condition", `${product.condition}/10 · ${product.conditionLabel}`],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>{" "}
        / <span className="text-foreground">{product.model}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setZoom((z) => !z)}
            aria-label={zoom ? "Zoom out" : "Zoom in"}
            className="block w-full overflow-hidden rounded-3xl border bg-surface"
          >
            <img
              src={product.images[active]}
              alt={`${product.name}, view ${active + 1}`}
              width={900}
              height={900}
              className={cn(
                "aspect-square w-full object-cover transition-transform duration-500",
                zoom && "scale-150",
              )}
            />
          </button>
          <div className="flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn(
                  "size-20 overflow-hidden rounded-xl border-2 bg-surface",
                  i === active ? "border-accent" : "border-transparent",
                )}
              >
                <img src={img} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{product.brand}</span>
            {sold && (
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                {product.availability}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {product.model}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.colorway} · Size {product.size}
          </p>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="display-xl text-4xl">{formatAUD(product.price)}</span>
            <span className="text-sm text-muted-foreground line-through">
              {formatAUD(product.retailPrice)}
            </span>
            {discount > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-accent-foreground">
                {discount}% under retail
              </span>
            )}
          </div>

          {/* Condition meter */}
          <div className="mt-6 rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>Condition</span>
              <span>
                {product.condition}/10 · {product.conditionLabel}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${product.condition * 10}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              disabled={sold}
              className="min-h-12 flex-1 rounded-full"
              onClick={() => {
                addToCart(product.id);
                toast.success("Added to cart");
              }}
            >
              <ShoppingBag className="mr-1 size-4" />
              {sold ? "Unavailable" : "Add to cart"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              aria-pressed={saved}
              className="min-h-12 rounded-full"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart className={cn("mr-1 size-4", saved && "fill-current text-accent")} />
              {saved ? "Saved" : "Save"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-12 rounded-full"
              aria-label="Share this product"
              onClick={() => toast("Link copied to clipboard")}
            >
              <Share2 className="size-4" />
            </Button>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-4 text-accent" /> One-of-one pair — only 1 in stock
            </li>
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-accent" /> Tracked shipping Australia wide
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" /> No online payment — we contact you to
              confirm
            </li>
          </ul>

          <Accordion type="single" collapsible defaultValue="specs" className="mt-8">
            <AccordionItem value="specs">
              <AccordionTrigger>Specifications</AccordionTrigger>
              <AccordionContent>
                <dl className="divide-y">
                  {specs.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-2 gap-4 py-2 text-sm">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping & returns</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Flat $15 tracked shipping anywhere in Australia, free over $300. Sizing issues can
                be returned within 7 days of delivery.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight">More {product.brand}</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
