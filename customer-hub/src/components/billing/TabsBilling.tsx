import InvoiceHistory from "./InvoiceHistory";
import { motion } from "motion/react";
import { motionFadeUp } from "@/lib/utils";
import PaymentsHistory from "./PaymentHistory";
import { useDashboardStore } from "@/store/dashboardStore";
import { useShallow } from "zustand/shallow";

const TabsBilling: React.FC = () => {
  
  const {billingTab, setBillingTab} = useDashboardStore(useShallow((state) => ({
    billingTab: state.billingTab,
    setBillingTab: state.setBillingTab
  })))

  const handleTabChange = (tab: any) => {
    setBillingTab(tab);
  };

  return (
    <div>
      {/* Header with tabs right next to the title */}
      <div className="flex items-center border-b pb-2 mb-4 space-x-2">
        <span className="text-xl font-semibold">Billing </span>
        <div className="ml-3 space-x-2 text-sm">
          <button
            onClick={() => handleTabChange("invoices")}
            className={`h-6 px-0.5 rounded-none border-b transition-all duration-200 cursor-pointer  ${billingTab === "invoices" ? "border-primary" : "border-transparent"
              }`}
          >
            Invoices
          </button>

          <button
            onClick={() => handleTabChange("payments")}
            className={`h-6 px-0.5 rounded-none border-b transition-all duration-200 cursor-pointer  ${billingTab === "payments" ? "border-primary" : "border-transparent"
              }`}
          >
            Payments
          </button>
        </div>

      </div>

      
        {/* Invoices Tab */}
        {billingTab === "invoices" && (
          <motion.div {...motionFadeUp} key={billingTab}>
            <InvoiceHistory />
          </motion.div>
        )}

        {/* Payments Tab */}
        {billingTab === "payments" && (
          <motion.div {...motionFadeUp} key={billingTab}>
            <PaymentsHistory />
          </motion.div>
        )}
      
    </div>
  );
}

export default TabsBilling