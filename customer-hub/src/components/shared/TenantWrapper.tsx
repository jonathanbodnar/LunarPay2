import { useParams, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/auth/AuthProvider";
import MainLayout from "@/components/layouts/MainLayout";
import LoginPage from "@/pages/LoginPage";
import DashPage from "@/pages/DashPage";
import SubscriptionCancel from "@/components/billing/SubscriptionCancel";
import PaymentMethodCancel from "@/components/billing/PaymentMethodCancel";
import ShopPage from "@/pages/ShopPage";
import CheckoutPage from "@/pages/CheckoutPage";

const TenantWrapper: React.FC = () => {
  const { tenant } = useParams(); // Get tenant slug from URL
  const navigate = useNavigate();

  useEffect(() => {
    console.log('TenantWrapper slug:', tenant); // Debugging line to check tenant slug
    if (!tenant) {
      navigate("/"); // Or any other error handling logic
    }
  }, [tenant]);

  if (!tenant) return <div>Tenant not found</div>;
  return (
    <AuthProvider tenantSlug={tenant}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route path="login" element={<LoginPage tenantSlug={tenant} />} />
          <Route path="shop" element={<ShopPage tenantSlug={tenant} />}></Route>
          <Route path="checkout" element={<CheckoutPage tenantSlug={tenant} />}></Route>
          <Route path="dash" element={<DashPage />}></Route>
          <Route path="subscription-cancel" element={<SubscriptionCancel />} />
          <Route path="payment-method-cancel" element={<PaymentMethodCancel />} />
          <Route path="*" element={<div>Not Found</div>} /> {/* Catch-all route for unmatched paths */}
        </Route>
        <Route path="*" element={<div>Not Found</div>} /> {/* Catch-all route for unmatched paths */}
      </Routes>
    </AuthProvider>
  );
};

export default TenantWrapper;

