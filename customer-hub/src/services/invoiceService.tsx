import { apiPrivate } from "@/services/api";

export const getInvoices = async () => {
  try {
    const response = await apiPrivate.get("/invoice/get_all_by_customer");
    return response;
  } catch (error) {
    throw error;
  }
};

