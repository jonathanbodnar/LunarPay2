import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FaLock } from "react-icons/fa6";
import LoginForm from "./LoginForm";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { OtpDialog } from "./OtpDialog";
import { MdArrowBackIosNew } from "react-icons/md";

type LoginDialogProps = {
    setShowLoginDialog: (show: boolean) => void,
    showDialog: boolean,
    tenantSlug: string
}
export const LoginDialog: React.FC<LoginDialogProps> = ({ setShowLoginDialog, showDialog, tenantSlug }) => {

    const { setShowOTPDialog, showOTPDialog, email, setEmail } = useAuthFlow();
    return (
        <Dialog open={showDialog} onOpenChange={setShowLoginDialog}>
            <DialogContent className="px-4 pt-5  w-108 space-y-0 [&>button:last-child]:hidden
                                      bg-gradient-to-t from-gray-200 to-gray-50
                                      dark: bg-gradient-to-b dark:from-black dark:to-gray-950
                                      ">

                {/* Header with lock and email */}
                <div className="flex justify-between items-center">
                    <span
                        onClick={() => setShowLoginDialog(false)}
                        className="cursor-pointer w-8"
                    >
                        <MdArrowBackIosNew />
                    </span>
                    <span className="flex items-center gap-2"><FaLock /> </span>
                </div>

                <DialogHeader className="m-0 p-0">
                    <DialogTitle className="text-xl text-center text-muted-foreground"></DialogTitle>
                    <DialogDescription className="text-center mt-2 font-semibold text-md gap-0">
                        Enter your email
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 pb-3">
                    <LoginForm setShowOTPDialog={setShowOTPDialog} email={email} setEmail={setEmail} />
                    <p className="mt-10 text-sm text-muted-foreground text-center">
                        Protected by industry-standard security protocols.
                    </p>
                </div>

                <OtpDialog
                    tenantSlug={tenantSlug}
                    email={email}
                    setShowOTPDialog={setShowOTPDialog}
                    showOTPDialog={showOTPDialog}
                    checkoutFlow={true}
                    setShowLoginDialog={setShowLoginDialog}
                    
                />
                {/* Resend Code Button */}

            </DialogContent>
        </Dialog>
    )


}