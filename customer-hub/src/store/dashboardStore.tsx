import { getProfile } from "@/services/userService";
import { getInvoices } from "@/services/invoiceService";
import { UserProfile } from "@/types/userProfileType";
import { Invoice } from "@/types/invoiceType";
import { errorHandler } from "@/services/api";
import { toast } from "sonner";
import { Payment } from "@/types/paymentType";
import { getPayments } from "@/services/paymentService";
import { createWithReset as create } from "./storeWithResetWrap";
import { PaymentWithProducts } from "@/types/PaymentProductType";
import { getProductsPaid } from "@/services/paymentService";


type DashboardDataState = {
  userProfile: UserProfile | null;
  invoices: Invoice[] | null;
  
  payments: Payment[] | null;
  totalPayments: number;
  currentPage: number, //verify change name relative to payments

  paymentsProducts: PaymentWithProducts[] | null;
  
  serviceTab: 'subscriptions' | 'products';
  billingTab: 'invoices' | 'payments';
  dashLoaded: boolean
}

type DashboardActions = {

  resetState: () => void
  paymentsLoading: boolean;
  fetchPayments: (page?: number) => Promise<void>;
  userProfileLoading: boolean;
  fetchUserProfile: () => Promise<void>;
  invoicesLoading: boolean;
  fetchInvoices: () => Promise<void>;
  setCurrentPage: (page: number) => void,
  setDashLoaded: (loaded: boolean) => void
  setServiceTab: (tab: DashboardDataState['serviceTab']) => void
  setBillingTab: (tab: DashboardDataState['billingTab']) => void

  productsLoading: boolean;
  fetchProducts: () => Promise<void>
}

type DashboardState = DashboardDataState & DashboardActions;

const initialDashboardDataState: DashboardDataState = {
  userProfile: null,
  invoices: null,
  payments: null,
  totalPayments: 0,
  currentPage: 1,

  paymentsProducts: null,  

  serviceTab: 'subscriptions',
  billingTab: 'invoices',
  dashLoaded: false
};

export const useDashboardStore = create<DashboardState>((set) => ({
  resetState: () => set(initialDashboardDataState),

  serviceTab: 'subscriptions',
  billingTab: 'invoices',
  setServiceTab: (tab) => set({ serviceTab: tab }),
  setBillingTab: (tab) => set({ billingTab: tab }),
  
  dashLoaded: false,
  setDashLoaded: (loaded) => set({ dashLoaded: loaded }),

  userProfile: null,
  userProfileLoading: false,
  fetchUserProfile: async () => {
    set({ userProfileLoading: true });
    try {
      const res = await getProfile();
      if (res?.data?.response?.status) {
        set({ userProfile: res.data.response.user });
      } else {
        toast.error(errorHandler(res));
      }
    } catch (err: any) {
      toast.error(errorHandler(err));
    } finally {
      set({ userProfileLoading: false });
    }
  },

  invoices: null,
  invoicesLoading: false,
  fetchInvoices: async () => {
    set({ invoicesLoading: true });
    try {
      const res = await getInvoices();
      if (res?.data?.response?.status) {
        set({ invoices: res.data.response.invoices });
      } else {
        toast.error(errorHandler(res));
      }
    } catch (err: any) {
      toast.error(errorHandler(err));
    } finally {
      set({ invoicesLoading: false });
    }
  },

  payments: null,
  paymentsLoading: false,
  totalPayments: 0,
  currentPage: 1,
  fetchPayments: async (page = 1) => {
    const limit = 5;
    set({ paymentsLoading: true });
    try {
      const res = await getPayments(page, limit);
      if (res?.data?.response?.status) {
        const newData = res.data.response.data.payments;
        const total = res.data.response.data.total;
  
        set((state) => ({
          payments: page === 1 ? newData : [...(state.payments || []), ...newData],
          totalPayments: total,
        }));
      } else {
        toast.error(errorHandler(res));
      }
    } catch (err: any) {
      toast.error(errorHandler(err));
    } finally {
      set({ paymentsLoading: false });
    }
  },
  setCurrentPage: (page: number) => set({ currentPage: page }),

  paymentsProducts: null,
  productsLoading: false,
  fetchProducts: async () => {
    set({ productsLoading: true });
    try {
      const res = await getProductsPaid();
      if (res?.data?.response?.status) {
        set({ paymentsProducts: res.data.response.data });
      } else {
        toast.error(errorHandler(res));
      }
    } catch (err: any) {
      toast.error(errorHandler(err));
    } finally {
      set({ productsLoading: false });
    }
  }
}));