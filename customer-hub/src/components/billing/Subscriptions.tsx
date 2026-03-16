import React, { use, useEffect } from 'react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { GetAuthContext } from "@/contexts/auth/GetAuthContext";
import { Subscription } from '@/types/subscriptionType';
import { formatDate, formatMoney } from '@/lib/utils';
import LoaderSmall from '../ui/loader-small';
import { useDashboardStore } from '@/store/dashboardStore';
import {useShallow } from 'zustand/shallow';

const Subscriptions: React.FC = () => {

  const { tenant } = GetAuthContext();

  const { userProfile, userProfileLoading } = useDashboardStore(
    useShallow((state) => ({
      userProfile: state.userProfile,
      userProfileLoading: state.userProfileLoading,
    }))
  );
 
  const navigate = useNavigate();

  const subscriptions = userProfile?.subscriptions || [];

  const handleCancel = (subscription: Subscription) => {

    navigate(`/${tenant}/subscription-cancel`, {
      state: { subscription },
    });
  };

  console.log('Subscriptions');
  
  return (
    <div className="">
      {/* <h2 className="border-b pb-3 text-xl font-semibold mb-4">Current Subscriptions</h2> */}
      <ul className="space-y-2">
        {userProfileLoading ? <LoaderSmall /> : subscriptions.length === 0 ? <p>No items found.</p> : (
          <>
            {subscriptions.map((subscription) => (
              <li
                key={subscription.id}
                className="flex justify-between items-center px-3 w-full max-w-full md:max-w-[450px]"
              >
                <div className={`${subscriptions.indexOf(subscription) === subscriptions.length - 1 ? '' : 'pb-5'}`}>
                  <p className="font-medium">{subscription.product_name}</p>
                  <p className="text-xl font-bold capitalize">{formatMoney(subscription.amount)} <span className="text-sm font-normal"> / {subscription.frequency}</span></p>

                  <p>Next billing date: {formatDate(subscription.next_payment_on)}</p>

                  <div className="flex justify-between items-center">
                    <p className="capitalize">{subscription.src_account_type} •••• {subscription.last_digits}</p>
                    <div>

                      {/* {method.isDefault && <p className="text-green-600 text-sm">Default</p>} */}
                    </div>
                  </div>

                </div>
                <Button variant="ghost" onClick={() => handleCancel(subscription)}>
                  Cancel
                </Button>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
};

export default Subscriptions;