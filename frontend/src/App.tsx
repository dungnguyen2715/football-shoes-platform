import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import { MainLayout } from "./layouts/MainLayout";

const Home = lazy(() => import("./pages/Home"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Account = lazy(() => import("./pages/Account"));
const Login = lazy(() => import("./pages/Login"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const OrderConfirmed = lazy(() => import("./pages/OrderConfirmed"));
const AdminLayout = lazy(() =>
  import("./layouts/AdminLayout").then((module) => ({ default: module.AdminLayout })),
);
const AdminOverview = lazy(() => import("./pages/Admin"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="product/:productId" element={<ProductDetail />} />
          <Route path="shop" element={<Shop />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="account" element={<Account />} />
          <Route path="login" element={<Login />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="order-confirmed" element={<OrderConfirmed />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
