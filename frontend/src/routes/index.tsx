import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Truck, BadgeCheck, Star } from "lucide-react";

import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { products, brands, reviews, surfaceLabel, surfaces } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bootyard — Pre-Owned Football Shoes in Australia" },
      {
        name: "description",
        content:
          "Shop authenticated second-hand football boots. Every pair graded 1-10, photographed in detail and shipped Australia wide.",
      },
      { property: "og:title", content: "Bootyard — Pre-Owned Football Shoes in Australia" },
      {
        property: "og:description",
        content: "Shop authenticated second-hand football boots. Every pair graded 1-10, photographed in detail and shipped Australia wide.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = products.filter((p) => p.availability !== "sold").slice(0, 4);
  const latest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-foreground text-background">
        <img
          src={heroImg}
          alt="Football boot on a floodlit pitch"
          width={1600}
          height={1200}
          className="absolute inset-0 size-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/40" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-36">
          <p className="eyebrow text-accent">Second-hand · Melbourne, AU</p>
          <h1 className="display-xl mt-4 max-w-3xl text-[3rem] text-white sm:text-7xl lg:text-8xl">
            Boots with
            <br />
            history left
            <br />
            <span className="text-accent">in them.</span>
          </h1>
          <p className="mt-6 max-w-md text-base text-white/80">
            Every pair is inspected, graded out of ten and listed once. When it's gone, it's gone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-12 rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90">
              <Link to="/shop">
                Shop the yard <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
          <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/20 pt-6">
            {[
              ["480+", "Pairs rehomed"],
              ["9.1", "Avg. condition"],
              ["48h", "Dispatch time"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="display-xl text-2xl text-white sm:text-3xl">{v}</dt>
                <dd className="mt-1 text-[11px] uppercase tracking-widest text-white/60">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b bg-surface">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6">
          {[
            [ShieldCheck, "Authenticity checked", "Every pair verified before listing"],
            [BadgeCheck, "Honest 1–10 grading", "Photos of every flaw, no filters"],
            [Truck, "AU wide shipping", "Tracked dispatch within 48 hours"],
          ].map(([Icon, title, sub]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={title as string} className="flex min-w-0 items-center gap-3">
                <I className="size-5 shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{title as string}</p>
                  <p className="truncate text-xs text-muted-foreground">{sub as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <Section
        eyebrow="Hand picked"
        title="Featured pairs"
        action={<Link to="/shop" className="text-sm font-bold underline underline-offset-4">View all</Link>}
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      {/* Brands */}
      <Section eyebrow="Browse" title="Popular brands">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {brands.map((b) => (
            <Link
              key={b}
              to="/shop"
              search={{ brand: b }}
              className="card-lift grid min-h-24 place-items-center rounded-2xl border bg-card text-lg font-extrabold tracking-tight"
            >
              {b}
            </Link>
          ))}
        </div>
      </Section>

      {/* Surface collections */}
      <Section eyebrow="Collections" title="Shop by surface">
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
          {surfaces.map((s) => (
            <Link
              key={s}
              to="/shop"
              search={{ surface: s }}
              className="card-lift w-44 shrink-0 snap-start rounded-2xl border bg-gradient-to-br from-surface to-card p-5 sm:w-auto"
            >
              <p className="display-xl text-3xl text-accent">{s}</p>
              <p className="mt-2 text-sm font-semibold">{surfaceLabel[s]}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 overflow-hidden rounded-3xl bg-foreground p-8 text-background sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-accent">Sell with us</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Got boots gathering dust in the garage?
            </h2>
            <p className="mt-3 max-w-md text-sm text-background/70">
              Send us three photos and your size. We grade, list and handle the buyer — you get paid
              when they ship.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <Button asChild size="lg" className="min-h-12 rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90">
              <Link to="/account">Start a listing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest */}
      <Section eyebrow="Fresh drops" title="Latest arrivals">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      {/* Reviews */}
      <Section eyebrow="From the sideline" title="What players say">
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex gap-0.5 text-accent" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed">{r.text}</blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{r.name}</span> · {r.location}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
