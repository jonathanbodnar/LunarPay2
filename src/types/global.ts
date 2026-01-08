// Global Type Extensions

// Extend Window interface for Fortis Commerce Elements
export interface FortisElements {
  create: (config: FortisElementsConfig) => void;
  on: (event: string, callback: (data?: unknown) => void) => void;
  submit: () => void;
  iframeResize: () => void;
  eventBus: {
    on: (event: string, callback: (data?: unknown) => void) => void;
  };
}

export interface FortisElementsConfig {
  container: string;
  theme?: string;
  hideTotal?: boolean;
  showReceipt?: boolean;
  showSubmitButton?: boolean;
  environment?: 'sandbox' | 'production';
  appearance?: {
    colorButtonSelectedBackground?: string;
    colorButtonSelectedText?: string;
    colorButtonText?: string;
    colorButtonBackground?: string;
    colorBackground?: string;
    colorText?: string;
    fontFamily?: string;
    fontSize?: string;
    borderRadius?: string;
  };
}

export interface FortisCommerce {
  elements: new (clientToken: string) => FortisElements;
}

// Augment the global Window interface
declare global {
  interface Window {
    Commerce?: FortisCommerce;
  }
}

