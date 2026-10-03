import { products as mockProducts } from "./data/mock-products";
import type { Product } from "@/types";

/** Synchronous mock-backed catalog access; replace these internals with API calls when a backend is available. */
export const getProducts = (): Product[] => mockProducts;

export const getProduct = (id: string | undefined): Product | undefined =>
  id ? mockProducts.find((product) => product.id === id || product.slug === id) : undefined;

export {
  brands,
  colors,
  formatAUD,
  reviews,
  sizes,
  surfaceLabel,
  surfaces,
} from "./data/mock-products";
