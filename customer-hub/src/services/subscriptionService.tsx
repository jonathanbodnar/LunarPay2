import { apiPrivate } from "@/services/api";

export const cancelSubscription = async (id: string) => {
  try {
    const response = await apiPrivate.post("/subscription/cancel", { subscription_id: id });
    return response;
  } catch (error) {
    throw error;
  }
};

