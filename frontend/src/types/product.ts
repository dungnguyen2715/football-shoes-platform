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
  condition: number;
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

export interface Review {
  name: string;
  location: string;
  text: string;
  rating: number;
}
