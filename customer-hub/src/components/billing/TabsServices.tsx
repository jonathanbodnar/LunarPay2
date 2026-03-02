import InvoiceHistory from "./InvoiceHistory";
import { useState } from "react";
import { motion } from "motion/react";
import { motionFadeUp } from "@/lib/utils";
import PaymentsHistory from "./PaymentHistory";
import Subscriptions from "@/components/billing/Subscriptions";
import { useLocation, useNavigate } from "react-router-dom";
import { useShallow } from "zustand/shallow";
import { useDashboardStore } from "@/store/dashboardStore";
import Products from "./Products";

const TabsServices: React.FC = () => {

  const { serviceTab, setServiceTab } = useDashboardStore(useShallow((state) => ({
    serviceTab: state.serviceTab,
    setServiceTab: state.setServiceTab
  })));

  const handleTabChange = (tab: any) => {
    setServiceTab(tab);
  };

  return (
    <div className="mb-6">
      {/* Header with tabs right next to the title */}
      <div className="flex items-center border-b pb-2 mb-4 space-x-2">
        <span className="text-xl font-semibold">Services </span>
        <div className="ml-3 space-x-2 text-sm">
          <button
            onClick={() => handleTabChange("subscriptions")}
            className={`h-6 px-0.5 rounded-none border-b transition-all duration-200 cursor-pointer  ${serviceTab === "subscriptions" ? "border-primary" : "border-transparent"
              }`}
          >
            My Subscriptions
          </button>

          <button
            onClick={() => handleTabChange("products")}
            className={`h-6 px-0.5rounded-none border-b transition-all duration-200 cursor-pointer  ${serviceTab === "products" ? "border-primary" : "border-transparent"
              }`}
          >
            My Products
          </button>
        </div>

      </div>


      {serviceTab === "subscriptions" && (
        <motion.div {...motionFadeUp} key={serviceTab} className="">
          <Subscriptions />
        </motion.div>
      )}

      {/* Payments Tab */}
      {serviceTab === "products" && (
        <motion.div {...motionFadeUp} key={serviceTab} className="">
          <Products />
        </motion.div>
      )}
    </div>
  );
}

export default TabsServices