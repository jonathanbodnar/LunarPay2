import React, { use, useEffect } from 'react';
import { Button } from '../ui/button';
import { PaymentMethod } from '@/types/paymentMethodType';
import { useNavigate } from 'react-router-dom';
import { GetAuthContext } from "@/contexts/auth/GetAuthContext";
import LoaderSmall from '../ui/loader-small';
import { useDashboardStore } from '@/store/dashboardStore';
import { useShallow } from 'zustand/shallow';

const PaymentMethods: React.FC = () => {

  const { tenant } = GetAuthContext();

  const { userProfile, userProfileLoading } = useDashboardStore(
    useShallow((state) => ({
      userProfile: state.userProfile,
      userProfileLoading: state.userProfileLoading,
    }))
  );
  
  const navigate = useNavigate();

  const methods = userProfile?.sources || [];

  const handleCancel = (paymentMethod: PaymentMethod) => {

    navigate(`/${tenant}/payment-method-cancel`, {
      state: { paymentMethod },
    });
  };

  console.log('PaymentMethods');

  return (
    <div className="mb-6">
      <h2 className="border-b pb-3 text-xl font-semibold mb-2">Payment Methods</h2>
      <ul className="space-y-2">
        {userProfileLoading ? <LoaderSmall /> : methods.length === 0 ? <p>No items found.</p> : (
          <>
            {methods.map((method) => (
              <li
                key={method.id}
                className="flex justify-between items-center px-3 w-full max-w-full md:max-w-[450px]"
              >
                <div>
                  <p className="capitalize">{method.src_account_type} •••• {method.last_digits}</p>
                  {/* {method.isDefault && <p className="text-green-600 text-sm">Default</p>} */}
                </div>
                <Button variant="ghost" onClick={() => handleCancel(method)}>
                  Remove
                </Button>
              </li>
            ))}
          </>
        )}
      </ul>
      {/* <div className="mt-4">
        <button className="text-blue-600 hover:underline">Add payment method</button>
      </div> */}
    </div>
  );
};

// Delete Icon
const DeleteIcon: React.FC = () => {
  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l8 8M12 4L4 12"></path>
      </svg>
    </>
  );
};

export default PaymentMethods;
