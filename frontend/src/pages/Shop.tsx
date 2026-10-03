import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/product/ProductCard";
import {
  brands,
  colors,
  getProducts,
  sizes,
  surfaceLabel,
  surfaces,
} from "@/features/products/products.service";
import type { Surface } from "@/types";

type Sort = "newest" | "price-asc" | "price-desc" | "condition";

export default function Shop() {
  const products = getProducts();
  const [searchParams] = useSearchParams();
  const initial = {
    brand: searchParams.get("brand") || undefined,
    surface: searchParams.get("surface") || undefined,
  };
  const [query, setQuery] = useState("");
  const [brandSel, setBrandSel] = useState<string[]>(initial.brand ? [initial.brand] : []);
  const [sizeSel, setSizeSel] = useState<string[]>([]);
  const [surfaceSel, setSurfaceSel] = useState<string[]>(initial.surface ? [initial.surface] : []);
  const [colorSel, setColorSel] = useState<string[]>([]);
  const [minCondition, setMinCondition] = useState(6);
  const [maxPrice, setMaxPrice] = useState(500);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const results = useMemo(() => {
    const filtered = products.filter((p) => {
      if (query && !`${p.name} ${p.colorway} ${p.size}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (brandSel.length && !brandSel.includes(p.brand)) return false;
      if (sizeSel.length && !sizeSel.includes(p.size)) return false;
      if (surfaceSel.length && !surfaceSel.includes(p.surface)) return false;
      if (colorSel.length && !colorSel.includes(p.color)) return false;
      if (p.condition < minCondition) return false;
      if (p.price > maxPrice) return false;
      if (inStockOnly && p.availability !== "available") return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "condition") return b.condition - a.condition;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [
    products,
    query,
    brandSel,
    sizeSel,
    surfaceSel,
    colorSel,
    minCondition,
    maxPrice,
    inStockOnly,
    sort,
  ]);

  const activeCount =
    brandSel.length + sizeSel.length + surfaceSel.length + colorSel.length + (inStockOnly ? 1 : 0);

  const clearAll = () => {
    setBrandSel([]);
    setSizeSel([]);
    setSurfaceSel([]);
    setColorSel([]);
    setInStockOnly(false);
    setMinCondition(6);
    setMaxPrice(500);
  };

  const Filters = (
    <div className="space-y-8">
      <FilterGroup title="Brand">
        {brands.map((b) => (
          <CheckRow
            key={b}
            id={`b-${b}`}
            label={b}
            checked={brandSel.includes(b)}
            onChange={() => toggle(brandSel, setBrandSel, b)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Size (US)">
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sizeSel.includes(s)}
              onClick={() => toggle(sizeSel, setSizeSel, s)}
              className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                sizeSel.includes(s)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "hover:bg-surface"
              }`}
            >
              {s.replace("US ", "")}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Surface">
        {surfaces.map((s) => (
          <CheckRow
            key={s}
            id={`s-${s}`}
            label={`${s} — ${surfaceLabel[s as Surface]}`}
            checked={surfaceSel.includes(s)}
            onChange={() => toggle(surfaceSel, setSurfaceSel, s)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Colour">
        {colors.map((c) => (
          <CheckRow
            key={c}
            id={`c-${c}`}
            label={c}
            checked={colorSel.includes(c)}
            onChange={() => toggle(colorSel, setColorSel, c)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={`Condition — ${minCondition}/10 and up`}>
        <Slider
          value={[minCondition]}
          min={5}
          max={10}
          step={1}
          onValueChange={([v]) => setMinCondition(v)}
          aria-label="Minimum condition"
        />
      </FilterGroup>

      <FilterGroup title={`Max price — $${maxPrice}`}>
        <Slider
          value={[maxPrice]}
          min={50}
          max={500}
          step={10}
          onValueChange={([v]) => setMaxPrice(v)}
          aria-label="Maximum price"
        />
      </FilterGroup>

      <FilterGroup title="Availability">
        <CheckRow
          id="stock"
          label="Available only"
          checked={inStockOnly}
          onChange={() => setInStockOnly((v) => !v)}
        />
      </FilterGroup>

      <Button variant="outline" className="w-full" onClick={clearAll}>
        Clear filters
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="eyebrow">The yard</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">All boots</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {results.length} pair{results.length === 1 ? "" : "s"} available right now
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{Filters}</div>
        </aside>

        <div>
          <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search boots"
                placeholder="Search model, colourway…"
                className="h-11 rounded-full pl-9"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="min-h-11 shrink-0 rounded-full lg:hidden">
                  <SlidersHorizontal className="size-4" />
                  <span className="ml-1">Filters{activeCount ? ` (${activeCount})` : ""}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl">
                <SheetTitle className="px-4 pt-4">Filters</SheetTitle>
                <div className="p-4">{Filters}</div>
              </SheetContent>
            </Sheet>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger
                className="hidden h-11 w-48 rounded-full sm:flex"
                aria-label="Sort products"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="condition">Best condition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeCount > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {[...brandSel, ...sizeSel, ...surfaceSel, ...colorSel].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-semibold"
                >
                  {t}
                </span>
              ))}
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-semibold underline"
              >
                <X className="size-3" /> clear
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="grid place-items-center rounded-3xl border border-dashed py-24 text-center">
              <p className="text-lg font-bold">No boots match those filters</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try widening the price range or clearing a brand — new pairs land every week.
              </p>
              <Button className="mt-6" onClick={clearAll}>
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
        {label}
      </Label>
    </div>
  );
}
