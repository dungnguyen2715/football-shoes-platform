export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  whatsapp: string;
  zalo: string;
  location: string;
}

export interface AdminCustomer extends CustomerProfile {
  id: string;
  orders: number;
  spent: number;
  lastOrder: string;
}
