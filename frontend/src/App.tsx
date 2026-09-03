import { Routes, Route } from "react-router-dom";

import { MainLayout } from "./layouts/MainLayout";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Wishlist from "./pages/Wishlist";
import OrderConfirmed from "./pages/OrderConfirmed";
import Admin from "./pages/Admin";

export default function App() {
  return (
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
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
