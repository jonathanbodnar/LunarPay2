import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export const GetAuthContext = () => { // PascalCase for avoiding hmr invalidate
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("GetAuthContext must be used within an AuthProvider");
  }
  return ctx;
};
