import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GetAuthContext } from "@/contexts/auth/GetAuthContext";
import LoaderSmall from "@/components/ui/loader-small";
import { toast } from "sonner";
import { errorHandler } from "@/services/api";

type LoginForm = {
  setShowOTPDialog: (show: boolean) => void
  setEmail: (email: string) => void
  email: string;
}
const LoginForm: React.FC<LoginForm> = ({ setShowOTPDialog, setEmail, email }) => {

  const { reqSecurityCode, tenantData } = GetAuthContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null); // Create a ref for the email input

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!email) {
      setError("Email is required");
      setLoading(false);
      emailRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const resp = await reqSecurityCode(email, tenantData.church_id);
      if (resp?.data?.response?.status) {
        setShowOTPDialog(true);
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(errorHandler(err), { position: "top-center", })
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    emailRef.current?.focus(); // Focus on the email input when the component loads
  }, []); // Empty dependency array means this runs only once, on component mount

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <Input
        ref={emailRef} // Attach the ref to the email input
        type="text"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2"
      />

      {error && <p className="text-destructive text-sm font-bold">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full p-2">
        {loading ? <LoaderSmall /> : "Send"}
      </Button>
    </form>
  );
};

export default LoginForm;