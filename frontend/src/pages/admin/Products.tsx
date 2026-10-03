import { useMemo, useState, type FormEvent } from "react";
import { ExternalLink, Package, Plus, Search, ShieldCheck, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusPill,
} from "@/features/admin/components/AdminUI";
import { formatAUD, getProducts } from "@/features/products/products.service";
import type { Availability, Product, Surface } from "@/types";

const surfaces: Surface[] = ["FG", "SG", "AG", "TF", "IC"];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<Availability | "all">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBrand, setDraftBrand] = useState("Nike");
  const [draftPrice, setDraftPrice] = useState("200");
  const [draftSize, setDraftSize] = useState("US 9");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.brand} ${product.model} ${product.size}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesAvailability = availability === "all" || product.availability === availability;
      return matchesSearch && matchesAvailability;
    });
  }, [availability, products, search]);

  const availableCount = products.filter((product) => product.availability === "available").length;
  const reservedCount = products.filter((product) => product.availability === "reserved").length;
  const soldCount = products.filter((product) => product.availability === "sold").length;
  const averageCondition = products.length
    ? (products.reduce((sum, product) => sum + product.condition, 0) / products.length).toFixed(1)
    : "—";

  const handleAddProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draftName.trim();
    const price = Number(draftPrice);
    const template = products[0];

    if (!name || !Number.isFinite(price) || price <= 0 || !template) {
      toast.error("Enter a product name and a valid price");
      return;
    }

    const productName = `${draftBrand} ${name}`;
    const nextProduct: Product = {
      ...template,
      id: `local-${Date.now()}`,
      slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: productName,
      brand: draftBrand,
      model: name,
      price,
      retailPrice: price,
      size: draftSize,
      condition: 8,
      conditionLabel: "Excellent",
      surface: surfaces[0],
      availability: "available",
      createdAt: new Date().toISOString().slice(0, 10),
      views: 0,
    };

    setProducts((currentProducts) => [nextProduct, ...currentProducts]);
    setIsAddOpen(false);
    setDraftName("");
    toast.success("Product added to this preview");
  };

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Inventory"
        title="Products"
        description="Manage the one-of-one boots listed in the Bootyard storefront."
        action={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="min-h-11 shrink-0 rounded-full">
                <Plus className="mr-2 size-4" /> Add product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a product</DialogTitle>
                <DialogDescription>
                  Add a mock listing to this admin preview. It will reset when the page reloads.
                </DialogDescription>
              </DialogHeader>
              <form id="add-product-form" className="space-y-4" onSubmit={handleAddProduct}>
                <label className="block space-y-2 text-sm font-medium">
                  Brand
                  <Input
                    value={draftBrand}
                    onChange={(event) => setDraftBrand(event.target.value)}
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  Model
                  <Input
                    autoFocus
                    required
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Mercurial Vapor"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block space-y-2 text-sm font-medium">
                    Price (AUD)
                    <Input
                      required
                      min="1"
                      type="number"
                      value={draftPrice}
                      onChange={(event) => setDraftPrice(event.target.value)}
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-medium">
                    Size
                    <Input
                      value={draftSize}
                      onChange={(event) => setDraftSize(event.target.value)}
                    />
                  </label>
                </div>
              </form>
              <DialogFooter>
                <Button type="submit" form="add-product-form" className="rounded-full">
                  Save listing
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Live inventory"
          value={`${availableCount}`}
          detail="Available in store"
          icon={Package}
        />
        <AdminMetricCard
          label="Reserved"
          value={`${reservedCount}`}
          detail="Awaiting confirmation"
          icon={ShieldCheck}
        />
        <AdminMetricCard
          label="Sold"
          value={`${soldCount}`}
          detail="One-of-one pairs moved"
          icon={Tag}
        />
        <AdminMetricCard
          label="Avg. condition"
          value={`${averageCondition}/10`}
          detail="Across current listings"
          icon={Package}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold">Store inventory</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredProducts.length} of {products.length} product listings
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search products"
                className="h-10 pl-9"
                placeholder="Search products…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={availability}
              onValueChange={(value) => setAvailability(value as Availability | "all")}
            >
              <SelectTrigger aria-label="Filter by availability" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">Product</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Surface</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Store page</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex min-w-56 items-center gap-3">
                      <img
                        src={product.images[0]}
                        alt=""
                        loading="lazy"
                        className="size-11 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.size}</TableCell>
                  <TableCell>{product.surface}</TableCell>
                  <TableCell>{product.condition}/10</TableCell>
                  <TableCell className="font-semibold">{formatAUD(product.price)}</TableCell>
                  <TableCell>
                    <AdminStatusPill status={product.availability} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" aria-label={`View ${product.name}`}>
                      <Link to={`/product/${product.id}`} target="_blank">
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                    No products match this search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
