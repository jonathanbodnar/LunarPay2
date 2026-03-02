import { api } from "@/services/api";

export const getAvailableProducts = async (tenantSlug: string) => {
  try {
    const response = await api.get(`/product/get_available_by_merchant/${tenantSlug}`);
    return response;
  } catch (error) {
    throw error;
  }
};

