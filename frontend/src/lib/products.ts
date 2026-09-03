import boot1 from "@/assets/boot-1.jpg";
import boot2 from "@/assets/boot-2.jpg";
import boot3 from "@/assets/boot-3.jpg";
import boot4 from "@/assets/boot-4.jpg";
import boot5 from "@/assets/boot-5.jpg";
import boot6 from "@/assets/boot-6.jpg";

export type Availability = "available" | "reserved" | "sold";
export type Surface = "FG" | "SG" | "AG" | "TF" | "IC";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  retailPrice: number;
  size: string;
  condition: number; // 1-10
  conditionLabel: string;
  surface: Surface;
  studType: string;
  colorway: string;
  color: string;
  images: string[];
  availability: Availability;
  description: string;
  createdAt: string;
  views: number;
}

const imgs = [boot1, boot2, boot3, boot4, boot5, boot6];

const conditionLabel = (c: number) =>
  c >= 9
    ? "Like new"
    : c >= 8
      ? "Excellent"
      : c >= 7
        ? "Very good"
        : c >= 6
          ? "Good"
          : "Well played";

const raw: Array<
  Omit<Product, "id" | "slug" | "images" | "conditionLabel" | "name"> & { img: number }
> = [
  {
    brand: "Adidas",
    model: "Copa Pure II Elite",
    price: 289,
    retailPrice: 400,
    size: "US 9",
    condition: 9,
    surface: "FG",
    studType: "Conical / bladed mix",
    colorway: "White / Gold Metallic",
    color: "White",
    availability: "available",
    description:
      "Kangaroo-touch upper with barely-there wear on the toe box. Worn for six matches on firm ground before an upgrade. Studs sharp, soleplate flex intact, no delamination.",
    createdAt: "2026-07-21",
    views: 1840,
    img: 0,
  },
  {
    brand: "Nike",
    model: "Mercurial Superfly 9 Elite",
    price: 340,
    retailPrice: 495,
    size: "US 8.5",
    condition: 8,
    surface: "FG",
    studType: "Bladed",
    colorway: "Black / Volt",
    color: "Green",
    availability: "available",
    description:
      "Flyknit collar holds shape perfectly. Light scuffing on the medial side from strike work. Plate is stiff, zero heel-counter breakdown.",
    createdAt: "2026-07-19",
    views: 2610,
    img: 1,
  },
  {
    brand: "Puma",
    model: "Ultra Ultimate",
    price: 165,
    retailPrice: 320,
    size: "US 10",
    condition: 7,
    surface: "AG",
    studType: "Conical",
    colorway: "Fiery Orange",
    color: "Orange",
    availability: "available",
    description:
      "Speed boot built for artificial grass. Honest cosmetic wear across the forefoot, upper still crisp and lockdown is excellent.",
    createdAt: "2026-07-16",
    views: 940,
    img: 2,
  },
  {
    brand: "Mizuno",
    model: "Morelia II Japan",
    price: 245,
    retailPrice: 360,
    size: "US 9.5",
    condition: 9,
    surface: "FG",
    studType: "Conical",
    colorway: "Triple Black",
    color: "Black" as const,
    availability: "reserved",
    description:
      "Made in Japan kangaroo leather, beautifully broken in with no overstretch. Insole original, laces replaced.",
    createdAt: "2026-07-14",
    views: 3120,
    img: 3,
  },
  {
    brand: "Nike",
    model: "Vapor XI Classic",
    price: 199,
    retailPrice: 300,
    size: "US 8",
    condition: 8,
    surface: "SG",
    studType: "Metal soft ground",
    colorway: "Racer Blue / Chrome",
    color: "Blue",
    availability: "available",
    description:
      "Winter-league soft ground pair. Metal studs at roughly 80 percent, chrome flash panel still mirror-clean.",
    createdAt: "2026-07-11",
    views: 1220,
    img: 4,
  },
  {
    brand: "Nike",
    model: "Mercurial Heritage Pack",
    price: 420,
    retailPrice: 460,
    size: "US 9",
    condition: 9,
    surface: "FG",
    studType: "Bladed",
    colorway: "Pink Blast / Volt",
    color: "Pink",
    availability: "sold",
    description:
      "Collector-grade pair from the heritage drop. Tried on indoors only, original box and spare laces included.",
    createdAt: "2026-07-05",
    views: 5400,
    img: 5,
  },
  {
    brand: "Adidas",
    model: "Predator Accuracy+",
    price: 210,
    retailPrice: 380,
    size: "US 11",
    condition: 7,
    surface: "FG",
    studType: "Bladed",
    colorway: "Core White / Gold",
    color: "White",
    availability: "available",
    description:
      "Laceless strike boot with rubber elements fully intact. Sole shows normal grass wear, upper cleaned and conditioned.",
    createdAt: "2026-07-02",
    views: 780,
    img: 0,
  },
  {
    brand: "Puma",
    model: "Future 7 Match TF",
    price: 95,
    retailPrice: 160,
    size: "US 7.5",
    condition: 6,
    surface: "TF",
    studType: "Turf nubs",
    colorway: "Volt / Black",
    color: "Green",
    availability: "available",
    description:
      "Weekly futsal-to-turf pair. Nubs rounded but plenty of grip left, ideal budget entry into the FUTURE line.",
    createdAt: "2026-06-28",
    views: 610,
    img: 1,
  },
  {
    brand: "New Balance",
    model: "Furon v7 Pro",
    price: 175,
    retailPrice: 290,
    size: "US 10.5",
    condition: 8,
    surface: "FG",
    studType: "Bladed",
    colorway: "Blaze Orange",
    color: "Orange",
    availability: "available",
    description:
      "Narrow-fit speed boot, one season of Saturday football. No stitching issues, insole swapped for fresh.",
    createdAt: "2026-06-24",
    views: 520,
    img: 2,
  },
  {
    brand: "Mizuno",
    model: "Alpha Elite",
    price: 230,
    retailPrice: 340,
    size: "US 9",
    condition: 9,
    surface: "FG",
    studType: "Hybrid",
    colorway: "Black / Silver",
    color: "Black",
    availability: "available",
    description:
      "Ultralight ZeroGlide liner, virtually unmarked. Sold by a semi-pro who changed sponsors mid-season.",
    createdAt: "2026-06-20",
    views: 1410,
    img: 3,
  },
  {
    brand: "Adidas",
    model: "X Crazyfast Messi",
    price: 260,
    retailPrice: 420,
    size: "US 8.5",
    condition: 8,
    surface: "FG",
    studType: "Bladed",
    colorway: "Blue / Silver",
    color: "Blue",
    availability: "available",
    description:
      "Signature colourway in strong shape. Slight crease across the toe, aeropacity speedskin still taut.",
    createdAt: "2026-06-15",
    views: 2010,
    img: 4,
  },
  {
    brand: "Nike",
    model: "Phantom Luna II Elite",
    price: 275,
    retailPrice: 400,
    size: "US 7",
    condition: 9,
    surface: "FG",
    studType: "Cyclone 360",
    colorway: "Pink / Volt",
    color: "Pink",
    availability: "available",
    description:
      "Womens fit elite pair worn for three training sessions. Gripknit tack still like factory fresh.",
    createdAt: "2026-06-10",
    views: 1660,
    img: 5,
  },
];

export const products: Product[] = raw.map((p, i) => {
  const name = `${p.brand} ${p.model}`;
  return {
    ...p,
    id: `bp-${1000 + i}`,
    slug: `${p.brand}-${p.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    conditionLabel: conditionLabel(p.condition),
    images: [imgs[p.img], imgs[(p.img + 2) % 6], imgs[(p.img + 4) % 6]],
  };
});

export const brands = ["Nike", "Adidas", "Puma", "Mizuno", "New Balance"];
export const sizes = [
  "US 7",
  "US 7.5",
  "US 8",
  "US 8.5",
  "US 9",
  "US 9.5",
  "US 10",
  "US 10.5",
  "US 11",
];
export const surfaces: Surface[] = ["FG", "SG", "AG", "TF", "IC"];
export const colors = ["Black", "White", "Blue", "Green", "Orange", "Pink"];

export const surfaceLabel: Record<Surface, string> = {
  FG: "Firm ground",
  SG: "Soft ground",
  AG: "Artificial grass",
  TF: "Turf",
  IC: "Indoor court",
};

export const getProduct = (id: string) => products.find((p) => p.id === id || p.slug === id);

export const formatAUD = (n: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);

export interface Review {
  name: string;
  location: string;
  text: string;
  rating: number;
}

export const reviews: Review[] = [
  {
    name: "Liam O.",
    location: "Melbourne, VIC",
    text: "Boots arrived cleaner than the photos. The condition rating was spot on and the owner messaged me within ten minutes of ordering.",
    rating: 5,
  },
  {
    name: "Ava N.",
    location: "Sydney, NSW",
    text: "Grabbed a pair of Morelias I'd been hunting for two years. Honest listings, no nonsense, quick postage.",
    rating: 5,
  },
  {
    name: "Daniel K.",
    location: "Brisbane, QLD",
    text: "Second pair from Bootyard. Being able to sort by stud type and surface saves so much time.",
    rating: 5,
  },
];

export interface AdminOrder {
  id: string;
  customer: string;
  contact: string;
  channel: string;
  items: number;
  total: number;
  status: "Pending" | "Contacted" | "Confirmed" | "Completed" | "Cancelled";
  date: string;
}

export const adminOrders: AdminOrder[] = [
  {
    id: "BY-2041",
    customer: "Liam O'Connell",
    contact: "+61 412 883 210",
    channel: "WhatsApp",
    items: 1,
    total: 289,
    status: "Pending",
    date: "2026-07-29",
  },
  {
    id: "BY-2040",
    customer: "Ava Nguyen",
    contact: "ava.n@email.com",
    channel: "Instagram",
    items: 2,
    total: 505,
    status: "Contacted",
    date: "2026-07-28",
  },
  {
    id: "BY-2039",
    customer: "Daniel Kerr",
    contact: "+61 401 224 907",
    channel: "Messenger",
    items: 1,
    total: 245,
    status: "Confirmed",
    date: "2026-07-28",
  },
  {
    id: "BY-2038",
    customer: "Sofia Marchetti",
    contact: "sofia.m@email.com",
    channel: "Email",
    items: 1,
    total: 175,
    status: "Completed",
    date: "2026-07-26",
  },
  {
    id: "BY-2037",
    customer: "Tom Whitfield",
    contact: "+61 433 118 002",
    channel: "Zalo",
    items: 1,
    total: 95,
    status: "Cancelled",
    date: "2026-07-25",
  },
];

export const revenueSeries = [
  { month: "Feb", revenue: 4200, orders: 18 },
  { month: "Mar", revenue: 5100, orders: 22 },
  { month: "Apr", revenue: 4800, orders: 20 },
  { month: "May", revenue: 6400, orders: 27 },
  { month: "Jun", revenue: 7900, orders: 33 },
  { month: "Jul", revenue: 9350, orders: 39 },
];
