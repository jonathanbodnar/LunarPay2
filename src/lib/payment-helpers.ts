/**
 * Payment helper functions matching PHP implementation
 */

// Payment method mapping (matches PHP Pay::mapPayOpts)
export const PAYMENT_METHOD_MAP: Record<string, string> = {
  credit_card: 'CC',
  bank_account: 'BANK',
  eth: 'ETH',
};

// Invoice status constants (matches PHP Invoice_model)
export const INVOICE_STATUS = {
  PAID: 'paid', // PHP uses 'P' but Next.js uses 'paid'
  CANCELED: 'canceled',
};

// Product recurrence constants (matches PHP Product_model)
export const PRODUCT_RECURRENCE = {
  ONE_TIME: 'O',
  PERIODICALLY: 'R',
  CUSTOM: 'C',
};

/**
 * Map payment method from frontend format to backend format
 * @param method - 'credit_card', 'bank_account', or 'eth'
 * @returns 'CC', 'BANK', or 'ETH'
 */
export function mapPaymentMethod(method: string | null): string | null {
  if (!method) return null;
  return PAYMENT_METHOD_MAP[method] || null;
}

/**
 * Validate payment method against allowed options
 * Handles both formats:
 * 1. JSON array format: '["CC","BANK"]'
 * 2. Plain string format: 'both', 'cc', 'ach'
 * @param method - Payment method from request
 * @param allowedOptions - JSON string array or plain string like 'both', 'cc', 'ach'
 * @returns true if valid, false otherwise
 */
export function validatePaymentMethod(method: string, allowedOptions: string | null): boolean {
  // If null or empty, allow all (no restrictions set)
  if (!allowedOptions || allowedOptions.trim() === '') {
    console.log('[Payment Validation] No payment options set, allowing all methods');
    return true;
  }
  
  const trimmedOptions = allowedOptions.trim().toLowerCase();
  
  // Handle plain string format: 'both', 'cc', 'ach'
  if (trimmedOptions === 'both') {
    // 'both' means both CC and BANK are allowed
    const mappedMethod = mapPaymentMethod(method);
    console.log('[Payment Validation] Plain string "both" format:', {
      method,
      mappedMethod,
      isValid: mappedMethod === 'CC' || mappedMethod === 'BANK',
    });
    return mappedMethod === 'CC' || mappedMethod === 'BANK';
  }
  
  if (trimmedOptions === 'cc') {
    // 'cc' means only credit card is allowed
    const mappedMethod = mapPaymentMethod(method);
    console.log('[Payment Validation] Plain string "cc" format:', {
      method,
      mappedMethod,
      isValid: mappedMethod === 'CC',
    });
    return mappedMethod === 'CC';
  }
  
  if (trimmedOptions === 'ach' || trimmedOptions === 'bank') {
    // 'ach' or 'bank' means only bank account is allowed
    const mappedMethod = mapPaymentMethod(method);
    console.log('[Payment Validation] Plain string "ach/bank" format:', {
      method,
      mappedMethod,
      isValid: mappedMethod === 'BANK',
    });
    return mappedMethod === 'BANK';
  }
  
  // Try to parse as JSON array format: '["CC","BANK"]'
  try {
    const options = JSON.parse(allowedOptions);
    
    // If not an array after parsing, invalid format
    if (!Array.isArray(options)) {
      console.warn('[Payment Validation] paymentOptions is not an array:', allowedOptions, 'parsed as:', options);
      return false;
    }
    
    // Empty array means no methods allowed (explicit restriction)
    if (options.length === 0) {
      console.log('[Payment Validation] Empty payment options array, no methods allowed');
      return false;
    }
    
    const mappedMethod = mapPaymentMethod(method);
    if (!mappedMethod) {
      console.warn('[Payment Validation] Could not map payment method:', method);
      return false;
    }
    
    const isValid = options.includes(mappedMethod);
    console.log('[Payment Validation] JSON array format result:', {
      method,
      mappedMethod,
      options,
      isValid,
    });
    
    return isValid;
  } catch (error) {
    // If JSON parse fails and it's not a recognized plain string, return false
    console.warn('[Payment Validation] Failed to parse paymentOptions:', allowedOptions, error);
    return false;
  }
}

/**
 * Check product integrity for payment links (matches PHP PL_checkProductsIntegrity)
 */
export interface ProductRequest {
  link_product_id: number;
  qty: number;
  start_date_input?: string;
}

export interface PaymentLinkProduct {
  id: number;
  qty: number | null;
  unlimitedQty: boolean;
  product: {
    id: number;
    price: number | string;
    isSubscription: boolean;
    subscriptionInterval: string | null;
    subscriptionIntervalCount: number | null;
    subscriptionTrialDays: number | null;
    startSubscriptionCustomDate: Date | null;
    customDate: boolean;
  };
}

export function checkProductsIntegrity(
  paymentLinkProducts: PaymentLinkProduct[],
  reqProducts: ProductRequest[]
): { valid: boolean; error?: string } {
  const dateNow = new Date();
  dateNow.setHours(0, 0, 0, 0);

  for (const reqProd of reqProducts) {
    let found = false;
    let quantityCheck = false;
    let dateCustomCheck = false;
    let dateRecurrentCheck = false;
    let linkProdOrigin: PaymentLinkProduct | null = null;

    // Find product in payment link
    for (const linkProd of paymentLinkProducts) {
      if (reqProd.link_product_id === linkProd.id) {
        found = true;
        linkProdOrigin = linkProd;
        
        // Check quantity
        if (linkProd.unlimitedQty || linkProd.qty === null) {
          quantityCheck = true;
        } else {
          quantityCheck = reqProd.qty <= linkProd.qty;
        }

        // Check subscription start date
        if (linkProd.product.isSubscription && linkProd.product.subscriptionInterval) {
          if (reqProd.start_date_input) {
            const startDate = new Date(reqProd.start_date_input);
            startDate.setHours(0, 0, 0, 0);
            dateRecurrentCheck = startDate >= dateNow;
          } else {
            dateRecurrentCheck = true; // No start date specified, use default
          }
        } else {
          dateRecurrentCheck = true;
        }

        // Check custom date products
        if (linkProd.product.customDate && linkProd.product.startSubscriptionCustomDate) {
          const customDate = new Date(linkProd.product.startSubscriptionCustomDate);
          customDate.setHours(0, 0, 0, 0);
          dateCustomCheck = customDate >= dateNow;
        } else {
          dateCustomCheck = true;
        }

        break;
      }
    }

    if (!found) {
      return { valid: false, error: 'Products integrity checks not passed' };
    }

    if (!quantityCheck) {
      return { valid: false, error: 'Products quantity checks not passed' };
    }

    if (!dateCustomCheck) {
      return { valid: false, error: 'This payment link has expired' };
    }

    if (!dateRecurrentCheck && linkProdOrigin) {
      return { 
        valid: false, 
        error: `Invalid start date for product: ${linkProdOrigin.product.isSubscription ? 'subscription' : 'product'}` 
      };
    }
  }

  return { valid: true };
}

/**
 * Recalculate products with request (matches PHP PL_recalcProductsWithRequest)
 */
export interface ProductWithRequest {
  id: number;
  productId: number;
  productPrice: number;
  qtyReq: number;
  subtotal: number;
  isSubscription: boolean;
  subscriptionInterval: string | null;
  subscriptionIntervalCount: number | null;
  startDateInput?: string;
}

export interface ProductsRecalcResult {
  totalAmount: number;
  totalAmountOneTime: number;
  products: ProductWithRequest[];
  countProductsOneTime: number;
}

export function recalcProductsWithRequest(
  paymentLinkProducts: PaymentLinkProduct[],
  reqProducts: ProductRequest[]
): ProductsRecalcResult {
  let totalAmount = 0;
  let totalAmountOneTime = 0;
  let countProductsOneTime = 0;
  const productsWithRequest: ProductWithRequest[] = [];

  for (const reqProd of reqProducts) {
    const linkProd = paymentLinkProducts.find(p => p.id === reqProd.link_product_id);
    if (!linkProd) continue;

    const productPrice = Number(linkProd.product.price || 0);
    const itemSubtotal = productPrice * reqProd.qty;

    const productWithRequest: ProductWithRequest = {
      id: linkProd.id,
      productId: linkProd.product.id || 0,
      productPrice,
      qtyReq: reqProd.qty,
      subtotal: itemSubtotal,
      isSubscription: linkProd.product.isSubscription || false,
      subscriptionInterval: linkProd.product.subscriptionInterval,
      subscriptionIntervalCount: linkProd.product.subscriptionIntervalCount,
    };

    if (reqProd.start_date_input) {
      productWithRequest.startDateInput = reqProd.start_date_input;
    }

    productsWithRequest.push(productWithRequest);

    // Check if one-time or subscription
    if (!linkProd.product.isSubscription) {
      totalAmountOneTime += itemSubtotal;
      countProductsOneTime++;
    }

    totalAmount += itemSubtotal;
  }

  return {
    totalAmount,
    totalAmountOneTime,
    products: productsWithRequest,
    countProductsOneTime,
  };
}

