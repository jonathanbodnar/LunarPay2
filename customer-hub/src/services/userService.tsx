import { apiPrivate } from "@/services/api";

export const getProfile = async () => {
  try {
    const response = await apiPrivate.post("/auth/get_user");
    return response;
  } catch (error) {
    throw error;
  }
};

