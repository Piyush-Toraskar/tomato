import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleRoute } from "./components/auth/RoleRoute";
import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import { RestaurantPage } from "./pages/RestaurantPage";
import { BasketPage } from "./pages/BasketPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailsPage } from "./pages/OrderDetailsPage";
import { AccountPage } from "./pages/AccountPage";
import { RestaurantDashboardPage } from "./pages/RestaurantDashboardPage";
import { DriverDashboardPage } from "./pages/DriverDashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="restaurants/:restaurantId" element={<RestaurantPage />} />
        <Route path="basket" element={<BasketPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="orders/:orderId/track" element={<OrderTrackingPage />} />
          <Route path="account" element={<AccountPage />} />

          <Route element={<RoleRoute roles={["CUSTOMER"]} />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders/:orderId/confirmation" element={<OrderConfirmationPage />} />
          </Route>

          <Route element={<RoleRoute roles={["RESTAURANT"]} />}>
            <Route path="restaurant/manage" element={<RestaurantDashboardPage />} />
          </Route>

          <Route element={<RoleRoute roles={["DRIVER"]} />}>
            <Route path="driver/manage" element={<DriverDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
