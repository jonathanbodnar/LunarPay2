import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GetAuthContext } from "@/contexts/auth/GetAuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaLock } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import LoaderSmall from "@/components/ui/loader-small";
import { toast } from "sonner";
import { errorHandler } from "@/services/api";
import { buildPaymentLinkDataFromCart, createPaymentLink } from "@/services/paymentLinkService";
import { useShopStore } from "@/store/shopStore";
import FullLoader from "../ui/full-loader";

type OtpDialogPropsBase = {
  tenantSlug: string;
  email: string;
  setShowOTPDialog: (showDialog: boolean) => void;
  showOTPDialog: boolean;
};

type OtpDialogPropsWithCheckout = OtpDialogPropsBase & {
  checkoutFlow: true;
  setShowLoginDialog: (showDialog: boolean) => void;
};

type OtpDialogPropsWithoutCheckout = OtpDialogPropsBase & {
  checkoutFlow?: false;
  setShowLoginDialog?: undefined;
};

// The union type (`OtpDialogProps`) combines two cases:
// 1. If `checkoutFlow` is `true`, we require the `setShowLoginDialog` function.
// 2. If `checkoutFlow` is `false` or not provided, we do not require `setShowLoginDialog`, and it can be optional.
// This ensures that the component behavior is flexible, only requiring `setShowLoginDialog` when necessary.
type OtpDialogProps = OtpDialogPropsWithCheckout | OtpDialogPropsWithoutCheckout;

export const OtpDialog: React.FC<OtpDialogProps> = ({ tenantSlug, email, setShowOTPDialog, showOTPDialog, checkoutFlow, setShowLoginDialog }) => {
  
   const { reqSecurityCode, verifyCode, tenantData } = GetAuthContext();
    
    const navigate = useNavigate();
    const [fullLoading, setFullLoading] = useState(false);
    const [reReqLoading, setReReqLoading] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", ""]);
    const [error, setError] = useState<string | null>(null);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    
    useEffect(() => {
      setOtp(["", "", "", "", ""]);
    }, [])
  
  
    const handleREReqSecurityCode = async () => {
  
      setError(null);
      setOtp(["", "", "", "", ""]);
      setReReqLoading(true);
  
      try {
        const resp = await reqSecurityCode(email, tenantData.church_id);
        if (resp?.data?.response?.status) {
          setReReqLoading(false);
          inputsRef.current[0]?.focus();
        } else {
          setError(resp.message);
        }
      } catch (err: any) {
        toast.error(errorHandler(err), { position: "top-center", })
      } finally {
        setReReqLoading(false);
      }
    };
  
    const handleVerifyCode = async (code: string) => {
  
      setError(null);
      setFullLoading(true);
      
      try {
        const resp = await verifyCode(email, code, tenantData.church_id);
        if (resp?.data?.response?.status) {
  
          setShowOTPDialog(false);
          
          if(checkoutFlow) {

            setShowLoginDialog(false);

            const productsCart = useShopStore.getState().cart;
            if (!productsCart || productsCart.length === 0) {
              throw new Error('Cart is empty');
            }
            const data = buildPaymentLinkDataFromCart(tenantData.church_id, productsCart);

            const resp = await createPaymentLink(data);
            
            if (resp?.data?.response?.status) {
              toast.success('Redirecting ...', { position: "top-center" })
              setTimeout(() => {
                window.location.href = resp.data.response.link;
              }, 2000);
              return;
            }

            return;
          }

          navigate(`/${tenantSlug}/dash`);
  
        } else {
          setError(resp?.data?.response?.message);
        }
      } catch (err: any) {
        toast.error(errorHandler(err), { position: "top-center", })
      } finally {
        setFullLoading(false);
      }
    };
  
  
    const handleOtpChange = (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
  
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
  
      // Automatically move to the next input if the user types a digit
      if (value && index < 4) {
        inputsRef.current[index + 1]?.focus();
      }
  
      // If all OTP fields are filled, trigger the verification function
      if (newOtp.every((digit) => digit !== "")) {
        handleVerifyCode(newOtp.join(""));
      }
    };
  
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    };
  
    const handleOtpOnPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
  
      const pastedData = e.clipboardData.getData('Text');
      const digits = pastedData.replace(/\D/g, '');
      const newOtp = [...digits].slice(0, 5);
      setOtp(newOtp);
      handleVerifyCode(digits);
  
    };

    if(fullLoading) {
      return <FullLoader />
    }
  
    return (
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent className="px-8 pt-5 pb-3 w-102 space-y-6 [&>button:last-child]:hidden
     bg-gradient-to-t from-gray-200 to-gray-50
     dark: bg-gradient-to-b dark:from-black dark:to-gray-950
     ">
  
          {/* Header with lock and email */}
          <div className="flex justify-between items-center">
            <FaLock />
            <span className="">Sign in</span>
          </div>
  
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-muted-foreground ">Enter your code</DialogTitle>
            <DialogDescription className="text-center mt-2 font-semibold text-md">
              Your access code is on its way! Enter it below to jump into your account and take control of your products and subscriptions.
            </DialogDescription>
          </DialogHeader>
  
          {/* OTP Inputs */}
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onPaste={(e) => handleOtpOnPaste(e)}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                className="w-12 h-12 text-center text-lg font-bold dark:bg-gray-700 bg-white border-none"
              />
            ))}
          </div>
  
          {error && <p className="text-center text-destructive">{error}</p>}
  
          <div className="text-center">
            <div className="font-semibold">Code sent to: </div>
            <div className="font-bold flex items-center justify-center gap-2">
              <MdEmail /> {email}
            </div>
          </div>
  
          {/* Resend Code Button */}
          <div className="flex gap-4 w-full">
            <Button
              onClick={handleREReqSecurityCode}
              className="flex-1"
              disabled={reReqLoading}
              variant="default"
            >
              {reReqLoading ? <LoaderSmall /> : "Resend Code"}
            </Button>
            <Button
              onClick={() => setShowOTPDialog(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
  
        </DialogContent>
      </Dialog>
    )
  
  
  }