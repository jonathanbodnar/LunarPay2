import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import { OtpDialog } from "@/components/auth/OtpDialog";
import { useAuthFlow } from "@/hooks/useAuthFlow";

const LoginPage: React.FC<{ tenantSlug: string }> = ({ tenantSlug }) => {

  const { setShowOTPDialog, showOTPDialog, setEmail, email } = useAuthFlow();

  return (
    <>
      <div className="flex justify-center md:justify-start md:pl-5 items-center mb-6">
        <div className="w-96 px-6 mt-0 md:mt-22 rounded-lg">
          <h2 className="text-2xl font-semibold mb-8 pt-25 md:pt-0">
            Sign in to access your account.
          </h2>
          <p>
            Just enter your email and we’ll send you a code to access your
            customer portal securely.
          </p>
          <LoginForm setShowOTPDialog={setShowOTPDialog} setEmail={setEmail} email={email} />
        </div>

        <OtpDialog
          tenantSlug={tenantSlug}
          email={email}
          setShowOTPDialog={setShowOTPDialog}
          showOTPDialog={showOTPDialog}
        />
      </div>

    </>
  );
};

export default LoginPage;