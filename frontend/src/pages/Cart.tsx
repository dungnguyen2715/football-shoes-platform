import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatAUD, getProduct } from "@/lib/products";
import { useShop } from "@/store/shop";

export default function Cart() {
  const { cart, setQty, removeFromCart } = useShop();
  const lines = cart.map((l) => ({ line: l, product: getProduct(l.id)! })).filter((x) => x.product);
  const subtotal = lines.reduce((sum, { line, product }) => sum + product.price * line.qty, 0);
  const shipping = subtotal === 0 || subtotal > 300 ? 0 : 15;

  if (lines.length === 0) {
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-surface">
          <ShoppingBag className="size-6 text-muted-foreground" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every pair in the yard is one of one. Find yours before someone else does.
        </p>
        <Button asChild className="mt-6 min-h-12 rounded-full px-6">
          <Link to="/shop">Browse boots</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="space-y-4">
          {lines.map(({ line, product }) => (
            <li
              key={line.id}
              className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-4"
            >
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className="size-22 aspect-square rounded-xl object-cover"
              />
              <div className="min-w-0">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <div className="min-w-0">
                    <p className="eyebrow">{product.brand}</p>
                    <p className="truncate font-bold">{product.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.size} · {product.condition}/10 · {product.surface}
                    </p>
                  </div>
                  <p className="font-extrabold">{formatAUD(product.price * line.qty)}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center rounded-full border">
                    <button
                      aria-label="Decrease quantity"
                      className="grid size-9 place-items-center"
                      onClick={() => setQty(line.id, line.qty - 1)}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{line.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      className="grid size-9 place-items-center disabled:opacity-40"
                      disabled
                      title="Only one of this pair exists"
                      onClick={() => setQty(line.id, line.qty + 1)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => removeFromCart(line.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold">{formatAUD(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-semibold">{shipping === 0 ? "Free" : formatAUD(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <dt className="font-bold">Estimated total</dt>
              <dd className="font-extrabold">{formatAUD(subtotal + shipping)}</dd>
            </div>
          </dl>
          <Button asChild className="mt-6 min-h-12 w-full rounded-full">
            <Link to="/checkout">
              Submit order request <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No payment is taken online. We'll contact you on your preferred channel to confirm the
            pair and arrange payment.
          </p>
        </aside>
      </div>
    </div>
  );
}
