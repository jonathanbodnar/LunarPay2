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
  hideAgreementCheckbox?: boolean;
  environment?: 'sandbox' | 'production';
  view?: string;
  language?: string;
  defaultCountry?: string;
  floatingLabels?: boolean;
  showValidationAnimation?: boolean;
  appearance?: {
    colorButtonActionBackground?: string;
    colorButtonActionText?: string;
    colorButtonSelectedBackground?: string;
    colorButtonSelectedText?: string;
    colorButtonText?: string;
    colorButtonBackground?: string;
    colorBackground?: string;
    colorFieldBackground?: string;
    colorFieldBorder?: string;
    colorText?: string;
    colorTitleText?: string;
    colorLink?: string;
    fontFamily?: 'Roboto' | 'Montserrat' | 'OpenSans' | 'Raleway' | 'SourceCode' | 'SourceSans';
    fontSize?: string;
    marginSpacing?: string;
    rowMarginSpacing?: string;
    trimWhitespace?: boolean;
    borderRadius?: string;
    borderWidth?: string;
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

