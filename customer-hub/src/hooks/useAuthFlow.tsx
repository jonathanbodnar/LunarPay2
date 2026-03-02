// hooks/useLoginFlow.ts
import { useState } from "react";
import { GetAuthContext } from "@/contexts/auth/GetAuthContext";

export const useAuthFlow = () => {
  const { reqSecurityCode, verifyCode, tenantData } = GetAuthContext();

  const [showOTPDialog, setShowOTPDialog] = useState(false);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  return {
    showOTPDialog,
    setShowOTPDialog,
    email,
    setEmail,
    error,
    setError,
    reqSecurityCode,
    verifyCode,
    tenantData,
  };
}