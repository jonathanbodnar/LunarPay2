import { PaymentMethod } from "./paymentMethodType";
import { Subscription } from "./subscriptionType";

  
  export type UserProfile = {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    created_at: string;
    sources: PaymentMethod[]; // initialized at runtime, not in the type
    subscriptions: Subscription[];
  };