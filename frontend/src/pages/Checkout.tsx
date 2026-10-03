import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAUD, getProduct } from "@/features/products/products.service";
import { useShop } from "@/store/shop";

const schema = z.object({
  name: z.string().min(2, "Tell us your name"),
  phone: z.string().min(8, "A contactable number helps us confirm fast"),
  email: z.string().email("Enter a valid email"),
  channel: z.string().min(1, "Pick a channel"),
  handle: z.string().optional(),
  address: z.string().min(6, "Enter your shipping address"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useShop();
  const lines = cart.flatMap((line) => {
    const product = getProduct(line.id);
    return product ? [{ qty: line.qty, product }] : [];
  });
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = subtotal > 300 || subtotal === 0 ? 0 : 15;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      channel: "WhatsApp",
      handle: "",
      address: "",
      notes: "",
    },
  });

  const onSubmit = () => {
    clearCart();
    navigate("/order-confirmed");
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Nothing to check out</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add a pair to your cart first.</p>
        <Button asChild className="mt-6 min-h-12 rounded-full px-6">
          <Link to="/shop">Browse boots</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Checkout</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        No payment happens here. Submit your request and the shop owner will reach out on your
        preferred channel within a few hours.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 rounded-2xl border bg-card p-6"
          >
            <fieldset className="space-y-4">
              <legend className="eyebrow mb-2">Your details</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field form={form} name="name" label="Full name" placeholder="Alex Turner" />
                <Field form={form} name="phone" label="Phone" placeholder="+61 4xx xxx xxx" />
              </div>
              <Field form={form} name="email" label="Email" placeholder="you@email.com" />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="eyebrow mb-2">How should we contact you?</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred channel</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "WhatsApp",
                            "Facebook Messenger",
                            "Instagram",
                            "Zalo",
                            "Phone call",
                          ].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Field
                  form={form}
                  name="handle"
                  label="Handle / username (optional)"
                  placeholder="@yourhandle"
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="eyebrow mb-2">Shipping</legend>
              <Field
                form={form}
                name="address"
                label="Address"
                placeholder="12 Smith St, Fitzroy VIC 3065"
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Anything we should know?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <Button type="submit" size="lg" className="min-h-12 w-full rounded-full">
              Submit order request
            </Button>
          </form>
        </Form>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold">Order summary</h2>
          <ul className="space-y-3">
            {lines.map(({ product, qty }) => (
              <li key={product.id} className="flex items-center gap-3">
                <img
                  src={product.images[0]}
                  alt=""
                  loading="lazy"
                  className="size-12 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{product.model}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.size} · Qty {qty}
                  </p>
                </div>
                <span className="text-sm font-semibold">{formatAUD(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatAUD(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatAUD(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-extrabold">
              <dt>Total</dt>
              <dd>{formatAUD(subtotal + shipping)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Field({
  form,
  name,
  label,
  placeholder,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  name: keyof FormValues;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input className="h-11" placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
