// Facebook Pixel utility for LunarPay
// Pixel ID: 1263082445552238

export const FB_PIXEL_ID = '1263082445552238';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

// Initialize the pixel (called once in layout)
export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

// Track custom events
export const event = (name: string, options: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', name, options);
  }
};

// Standard event helpers

// Lead event - when someone registers
export const trackLead = (data?: { email?: string; businessName?: string }) => {
  event('Lead', {
    content_name: 'Registration',
    ...data,
  });
};

// Purchase event - when onboarding is complete
export const trackPurchase = (data?: { 
  organizationName?: string; 
  value?: number;
  currency?: string;
}) => {
  event('Purchase', {
    content_name: 'Onboarding Complete',
    value: data?.value || 0,
    currency: data?.currency || 'USD',
    ...data,
  });
};

// CompleteRegistration - alternative to Lead if needed
export const trackCompleteRegistration = (data?: { email?: string }) => {
  event('CompleteRegistration', data);
};
