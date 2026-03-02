import { apiPrivate } from "@/services/api";

export const removePaymentMethod = async (id: string) => {
  try {
    const response = await apiPrivate.post("/source/remove", { source_id: id });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getPayments = async (page: number, limit: number) => {
  try {
    const response = await apiPrivate.get("/payment/get_all_by_customer?page=" + page + "&limit=" + limit);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getProductsPaid = async () => {
  try {
    const response = await apiPrivate.get("/payment/get_products_paid_by_customer");
    return response;
  } catch (error) {
    throw error;
  }
};

