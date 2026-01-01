// Fortis Payment Processor Client
// Implements all 5 Fortis API endpoints used in LunarPay

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  FortisConfig,
  MerchantOnboardingData,
  OnboardingResponse,
  TransactionIntentionData,
  TransactionIntentionResponse,
  CreditCardSaleData,
  ACHDebitData,
  TransactionResponse,
  RefundData,
  RefundResponse,
  FORTIS_REASON_CODES,
} from '@/types/fortis';

export class FortisClient {
  private client: AxiosInstance;
  private developerId: string;
  private userId: string;
  private userApiKey: string;
  private environment: 'sandbox' | 'production';

  constructor(config: FortisConfig) {
    this.developerId = config.developerId;
    this.userId = config.userId;
    this.userApiKey = config.userApiKey;
    this.environment = config.environment;

    const baseURL =
      config.environment === 'production'
        ? 'https://api.fortis.tech/v1/'
        : 'https://api.sandbox.fortis.tech/v1/';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'developer-id': config.developerId,
        'user-id': config.userId,
        'user-api-key': config.userApiKey,
      },
      timeout: 30000, // 30 seconds
    });

    // Add request/response interceptors for logging
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Fortis Request]', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
          });
        }
        return config;
      },
      (error) => {
        console.error('[Fortis Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Fortis Response]', {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      (error: AxiosError) => {
        console.error('[Fortis Response Error]', {
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  // Update credentials (used for merchant-specific operations)
  updateCredentials(userId: string, userApiKey: string) {
    this.userId = userId;
    this.userApiKey = userApiKey;
    this.client.defaults.headers['user-id'] = userId;
    this.client.defaults.headers['user-api-key'] = userApiKey;
  }

  /**
   * 1. MERCHANT ONBOARDING
   * POST /v1/onboarding
   * 
   * Creates a new merchant account in Fortis
   */
  async onboardMerchant(data: MerchantOnboardingData): Promise<{
    status: boolean;
    result?: OnboardingResponse;
    message?: string;
  }> {
    try {
      const response = await this.client.post<OnboardingResponse>('onboarding', data);

      if (response.data.type === 'Error') {
        return {
          status: false,
          result: response.data,
          message: response.data.detail || 'Onboarding failed',
        };
      }

      return {
        status: true,
        result: response.data,
      };
    } catch (error) {
      return {
        status: false,
        message: this.formatError(error),
      };
    }
  }

  /**
   * 2. TRANSACTION INTENTION (Elements)
   * POST /v1/elements/transaction/intention
   * 
   * Generates a client token for Fortis Elements payment form
   */
  async createTransactionIntention(
    data: TransactionIntentionData
  ): Promise<{
    status: boolean;
    clientToken?: string;
    message?: string;
  }> {
    try {
      // Validate amount for sale action
      if (data.action === 'sale') {
        if (!data.amount || !Number.isInteger(data.amount)) {
          return {
            status: false,
            message: 'Amount is required and must be an integer (in cents)',
          };
        }
      }

      const response = await this.client.post<TransactionIntentionResponse>(
        'elements/transaction/intention',
        data
      );

      if (response.data.data?.client_token) {
        return {
          status: true,
          clientToken: response.data.data.client_token,
        };
      }

      return {
        status: false,
        message: 'Failed to create transaction intention',
      };
    } catch (error) {
      return {
        status: false,
        message: this.formatError(error),
      };
    }
  }

  /**
   * 3. CREDIT CARD SALE WITH TOKEN
   * POST /v1/transactions/cc/sale/token
   * 
   * Process a credit card payment using saved token
   */
  async processCreditCardSale(data: CreditCardSaleData): Promise<{
    status: boolean;
    transaction?: TransactionResponse['data'];
    message?: string;
    reasonCode?: string;
  }> {
    try {
      const response = await this.client.post<TransactionResponse>(
        'transactions/cc/sale/token',
        data
      );

      const txData = response.data.data;

      // Check if transaction was approved (status_code 101, reason_code 1000)
      if (txData.status_code === 101 && txData.reason_code_id === 1000) {
        return {
          status: true,
          transaction: txData,
        };
      }

      // Transaction declined or failed
      const reasonMessage = FORTIS_REASON_CODES[txData.reason_code_id.toString()] || 'Unknown error';

      return {
        status: false,
        transaction: txData,
        message: `Payment declined: ${reasonMessage}`,
        reasonCode: txData.reason_code_id.toString(),
      };
    } catch (error) {
      return {
        status: false,
        message: this.formatError(error),
      };
    }
  }

  /**
   * 4. ACH DEBIT WITH TOKEN
   * POST /v1/transactions/ach/debit/token
   * 
   * Process an ACH/bank account payment using saved token
   */
  async processACHDebit(data: ACHDebitData): Promise<{
    status: boolean;
    transaction?: TransactionResponse['data'];
    message?: string;
    reasonCode?: string;
  }> {
    try {
      const response = await this.client.post<TransactionResponse>(
        'transactions/ach/debit/token',
        data
      );

      const txData = response.data.data;

      // ACH transactions are accepted initially (reason_code 1000)
      // Final status comes via webhook after bank processing
      if (txData.reason_code_id === 1000) {
        return {
          status: true,
          transaction: txData,
          message: 'ACH transaction initiated - waiting for bank clearance',
        };
      }

      const reasonMessage = FORTIS_REASON_CODES[txData.reason_code_id.toString()] || 'Unknown error';

      return {
        status: false,
        transaction: txData,
        message: `ACH transaction failed: ${reasonMessage}`,
        reasonCode: txData.reason_code_id.toString(),
      };
    } catch (error) {
      return {
        status: false,
        message: this.formatError(error),
      };
    }
  }

  /**
   * 5. REFUND TRANSACTION
   * PATCH /v1/transactions/{transactionId}/refund
   * 
   * Refund a previously processed transaction
   */
  async refundTransaction(
    transactionId: string,
    amount: number // in cents
  ): Promise<{
    status: boolean;
    refund?: RefundResponse['data'];
    message?: string;
  }> {
    try {
      const response = await this.client.patch<RefundResponse>(
        `transactions/${transactionId}/refund`,
        { transaction_amount: amount }
      );

      return {
        status: true,
        refund: response.data.data,
        message: 'Refund processed successfully',
      };
    } catch (error) {
      return {
        status: false,
        message: this.formatError(error),
      };
    }
  }

  /**
   * Format error for user-friendly message
   */
  private formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as any;
      
      if (data?.detail) {
        return data.detail;
      }
      
      if (data?.message) {
        return data.message;
      }

      if (error.message) {
        return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unknown error occurred';
  }

  /**
   * Get reason code message
   */
  static getReasonCodeMessage(reasonCode: number | string): string {
    return FORTIS_REASON_CODES[reasonCode.toString()] || 'Unknown reason code';
  }
}

/**
 * Factory function to create Fortis client
 * Uses environment variables matching original LunarPay config:
 * - fortis_environment: 'dev' or 'prd'
 * - fortis_developer_id_sandbox / fortis_developer_id_production
 * - fortis_onboarding_user_id_sandbox / fortis_onboarding_user_id_production
 * - fortis_onboarding_user_api_key_sandbox / fortis_onboarding_user_api_key_production
 */
export function createFortisClient(
  environment?: 'sandbox' | 'production',
  userId?: string,
  userApiKey?: string
): FortisClient {
  // Map 'dev' to 'sandbox', 'prd' to 'production'
  const fortisEnv = process.env.fortis_environment || 'dev';
  const env = environment || (fortisEnv === 'prd' ? 'production' : 'sandbox');
  
  const config: FortisConfig = {
    environment: env,
    developerId: env === 'sandbox'
      ? (process.env.fortis_developer_id_sandbox || process.env.FORTIS_DEVELOPER_ID_SANDBOX!)
      : (process.env.fortis_developer_id_production || process.env.FORTIS_DEVELOPER_ID_PRODUCTION!),
    userId: userId || (env === 'sandbox'
      ? (process.env.fortis_onboarding_user_id_sandbox || process.env.FORTIS_USER_ID_SANDBOX!)
      : (process.env.fortis_onboarding_user_id_production || process.env.FORTIS_USER_ID_PRODUCTION!)),
    userApiKey: userApiKey || (env === 'sandbox'
      ? (process.env.fortis_onboarding_user_api_key_sandbox || process.env.FORTIS_USER_API_KEY_SANDBOX!)
      : (process.env.fortis_onboarding_user_api_key_production || process.env.FORTIS_USER_API_KEY_PRODUCTION!)),
  };

  return new FortisClient(config);
}

/**
 * Get Fortis location ID for transaction operations
 */
export function getFortisLocationId(): string {
  const fortisEnv = process.env.fortis_environment || 'dev';
  const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
  
  return env === 'sandbox'
    ? (process.env.fortis_location_id_sandbox || process.env.FORTIS_LOCATION_ID_SANDBOX || '')
    : (process.env.fortis_location_id_production || process.env.FORTIS_LOCATION_ID_PRODUCTION || '');
}

