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
    // Trim all credentials to remove any whitespace
    this.developerId = config.developerId.trim();
    this.userId = config.userId.trim();
    this.userApiKey = config.userApiKey.trim();
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
        'developer-id': this.developerId,
        'user-id': this.userId,
        'user-api-key': this.userApiKey,
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
          // Mask credentials for logging (show first 4 and last 4 chars)
          const maskCredential = (cred: string) => {
            if (!cred || cred.length <= 8) return '***';
            return `${cred.substring(0, 4)}...${cred.substring(cred.length - 4)}`;
          };
          
          console.log('[Fortis Request]', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: {
              'developer-id': maskCredential(config.headers['developer-id'] as string),
              'user-id': maskCredential(config.headers['user-id'] as string),
              'user-api-key': maskCredential(config.headers['user-api-key'] as string),
            },
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
    this.userId = userId.trim();
    this.userApiKey = userApiKey.trim();
    this.client.defaults.headers['user-id'] = this.userId;
    this.client.defaults.headers['user-api-key'] = this.userApiKey;
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
   * GET MERCHANT APPLICATION STATUS
   * GET /v1/onboarding/{client_app_id}
   * 
   * Retrieves the current status of a merchant onboarding application
   */
  async getOnboardingStatus(clientAppId: string): Promise<{
    status: boolean;
    data?: {
      id: string;
      client_app_id: string;
      status: string;
      status_message?: string;
      users?: Array<{
        user_id: string;
        user_api_key: string;
        location_id?: string;
        locations?: Array<{ id: string }>;
      }>;
      locations?: Array<{
        id: string;
        product_transactions?: Array<{ id: string }>;
      }>;
    };
    message?: string;
  }> {
    try {
      const response = await this.client.get(`onboarding/${clientAppId}`);
      
      if (response.data?.data) {
        return {
          status: true,
          data: response.data.data,
        };
      }
      
      return {
        status: false,
        message: 'No data returned from Fortis',
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
   * 2B. TICKET INTENTION (Elements)
   * POST /v1/elements/ticket/intention
   * 
   * Generates a client token for Fortis Elements to collect card data
   * WITHOUT processing a payment. Used for recurring/subscription flows.
   * After Elements returns ticket_id, call processTicketSale to charge.
   */
  async createTicketIntention(
    data: { location_id: string }
  ): Promise<{
    status: boolean;
    clientToken?: string;
    message?: string;
  }> {
    try {
      const response = await this.client.post<TransactionIntentionResponse>(
        'elements/ticket/intention',
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
        message: 'Failed to create ticket intention',
      };
    } catch (error) {
      return {
        status: false,
        message: this.formatError(error),
      };
    }
  }

  /**
   * 2C. PROCESS TICKET SALE
   * POST /v1/transactions/cc/sale/ticket
   * 
   * Process a credit card payment using a ticket_id from Elements.
   * Can optionally save the card for future use with save_account: true
   */
  async processTicketSale(data: {
    ticket_id: string;
    transaction_amount: number;
    save_account?: boolean;
    location_id?: string;
    transaction_c1?: string;
    transaction_c2?: string;
  }): Promise<{
    status: boolean;
    transaction?: any;
    tokenId?: string;
    message?: string;
    reasonCode?: string;
  }> {
    try {
      console.log('[Fortis Ticket Sale] Processing:', data);
      
      const response = await this.client.post<TransactionResponse>(
        'transactions/cc/sale/ticket',
        data
      );

      const txData = response.data.data;
      
      console.log('[Fortis Ticket Sale] Response:', {
        id: txData.id,
        status_code: txData.status_code,
        reason_code_id: txData.reason_code_id,
        token_id: txData.token_id,
        transaction_amount: txData.transaction_amount,
      });

      // Check if transaction was approved
      const isApproved = txData.status_code === 101 && txData.reason_code_id === 1000;
      const isPending = txData.status_code === 102 && txData.reason_code_id === 1000;
      const hasTransactionId = !!txData.id;
      
      if (isApproved || isPending || (hasTransactionId && txData.reason_code_id === 1000)) {
        return {
          status: true,
          transaction: txData,
          tokenId: txData.token_id || undefined, // This is the saved card token
        };
      }

      const reasonMessage = FORTIS_REASON_CODES[txData.reason_code_id?.toString()] || 'Unknown error';

      return {
        status: false,
        transaction: txData,
        message: `Payment declined: ${reasonMessage}`,
        reasonCode: txData.reason_code_id?.toString(),
      };
    } catch (error) {
      console.error('[Fortis Ticket Sale] Error:', error);
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
      
      console.log('[Fortis CC Sale] Response:', {
        id: txData.id,
        status_code: txData.status_code,
        reason_code_id: txData.reason_code_id,
        transaction_amount: txData.transaction_amount,
      });

      // Check if transaction was approved
      // status_code 101 = approved, 102 = pending
      // reason_code_id 1000 = approved
      const isApproved = txData.status_code === 101 && txData.reason_code_id === 1000;
      const isPending = txData.status_code === 102 && txData.reason_code_id === 1000;
      const hasTransactionId = !!txData.id;
      
      if (isApproved || isPending || (hasTransactionId && txData.reason_code_id === 1000)) {
        return {
          status: true,
          transaction: txData,
        };
      }

      // Transaction declined or failed
      const reasonMessage = FORTIS_REASON_CODES[txData.reason_code_id?.toString()] || 'Unknown error';

      return {
        status: false,
        transaction: txData,
        message: `Payment declined: ${reasonMessage}`,
        reasonCode: txData.reason_code_id?.toString(),
      };
    } catch (error) {
      console.error('[Fortis CC Sale] Error:', error);
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
      
      console.log('[Fortis ACH Debit] Response:', {
        id: txData.id,
        status_code: txData.status_code,
        reason_code_id: txData.reason_code_id,
        transaction_amount: txData.transaction_amount,
      });

      // ACH transactions are accepted initially (reason_code 1000)
      // Final status comes via webhook after bank processing
      const hasTransactionId = !!txData.id;
      
      if (txData.reason_code_id === 1000 || (hasTransactionId && !txData.reason_code_id)) {
        return {
          status: true,
          transaction: txData,
          message: 'ACH transaction initiated - waiting for bank clearance',
        };
      }

      const reasonMessage = FORTIS_REASON_CODES[txData.reason_code_id?.toString()] || 'Unknown error';

      return {
        status: false,
        transaction: txData,
        message: `ACH transaction failed: ${reasonMessage}`,
        reasonCode: txData.reason_code_id?.toString(),
      };
    } catch (error) {
      console.error('[Fortis ACH Debit] Error:', error);
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
   * 6. GET LOCATIONS
   * GET /v1/locations
   * 
   * Fetches locations for the authenticated user
   * Used when location_id is not provided in onboarding webhook
   */
  async getLocations(): Promise<{
    status: boolean;
    locations?: Array<{
      id: string;
      name: string;
      product_transactions?: Array<{
        id: string;
        payment_method: string;
      }>;
    }>;
    message?: string;
  }> {
    try {
      const response = await this.client.get('locations');
      
      if (response.data?.list && Array.isArray(response.data.list)) {
        return {
          status: true,
          locations: response.data.list.map((loc: any) => ({
            id: loc.id,
            name: loc.name || loc.dba_name || 'Unknown',
            product_transactions: loc.product_transactions,
          })),
        };
      }
      
      return {
        status: false,
        message: 'No locations found',
      };
    } catch (error) {
      return {
        status: false,
        message: this.formatError(error),
      };
    }
  }

  /**
   * 7. GET LOCATION DETAILS
   * GET /v1/locations/{locationId}
   * 
   * Fetches details for a specific location
   */
  async getLocation(locationId: string): Promise<{
    status: boolean;
    location?: {
      id: string;
      name: string;
      product_transactions?: Array<{
        id: string;
        payment_method: string;
      }>;
    };
    message?: string;
  }> {
    try {
      const response = await this.client.get(`locations/${locationId}`);
      
      if (response.data?.data) {
        const loc = response.data.data;
        return {
          status: true,
          location: {
            id: loc.id,
            name: loc.name || loc.dba_name || 'Unknown',
            product_transactions: loc.product_transactions,
          },
        };
      }
      
      return {
        status: false,
        message: 'Location not found',
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

  /**
   * 8. GET TRANSACTION BATCHES (Settlements/Payouts)
   * GET /v1/transaction-batches
   * 
   * Fetches settlement/batch data showing what's been deposited to the merchant's bank
   * This is essentially the "payouts" data - money transferred from Fortis to merchant
   */
  async getTransactionBatches(params?: {
    page?: number;
    pageSize?: number;
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
  }): Promise<{
    status: boolean;
    batches?: Array<{
      id: string;
      batch_num: string;
      created_ts: number;
      batch_close_ts: number;
      is_open: boolean;
      processing_status_id: number;
      total_sale_amount: number;
      total_sale_count: number;
      total_refund_amount: number;
      total_refund_count: number;
      total_void_amount?: number;
      total_void_count?: number;
      net_amount?: number;
      location_id?: string;
    }>;
    pagination?: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page[number]', params.page.toString());
      if (params?.pageSize) queryParams.append('page[size]', (params.pageSize || 50).toString());
      
      // Filter by date range if provided
      if (params?.startDate) {
        queryParams.append('filter[created_ts]', `>=${new Date(params.startDate).getTime() / 1000}`);
      }
      if (params?.endDate) {
        queryParams.append('filter[created_ts]', `<=${new Date(params.endDate).getTime() / 1000}`);
      }
      
      // Sort by most recent first
      queryParams.append('sort', '-created_ts');
      
      const url = `transaction-batches${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('[Fortis] Fetching transaction batches:', url);
      
      const response = await this.client.get(url);
      
      console.log('[Fortis] Transaction batches response:', {
        status: response.status,
        hasData: !!response.data,
        hasList: !!response.data?.list,
        isArray: Array.isArray(response.data?.list),
        listLength: response.data?.list?.length || 0,
        fullResponse: JSON.stringify(response.data).substring(0, 500),
      });
      
      if (response.data?.list && Array.isArray(response.data.list)) {
        return {
          status: true,
          batches: response.data.list.map((batch: any) => ({
            id: batch.id,
            batch_num: batch.batch_num || batch.id,
            created_ts: batch.created_ts,
            batch_close_ts: batch.batch_close_ts,
            is_open: batch.is_open,
            processing_status_id: batch.processing_status_id,
            total_sale_amount: batch.total_sale_amount || 0,
            total_sale_count: batch.total_sale_count || 0,
            total_refund_amount: batch.total_refund_amount || 0,
            total_refund_count: batch.total_refund_count || 0,
            total_void_amount: batch.total_void_amount || 0,
            total_void_count: batch.total_void_count || 0,
            net_amount: (batch.total_sale_amount || 0) - (batch.total_refund_amount || 0),
            location_id: batch.location_id,
          })),
          pagination: response.data.pagination ? {
            page: response.data.pagination.page,
            pageSize: response.data.pagination.page_size,
            totalCount: response.data.pagination.total_count,
            totalPages: response.data.pagination.total_pages,
          } : undefined,
        };
      }
      
      return {
        status: true,
        batches: [],
        message: 'No batches found',
      };
    } catch (error) {
      console.error('[Fortis] Get transaction batches error:', {
        error: error,
        message: (error as any)?.message,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status,
      });
      return {
        status: false,
        message: this.formatError(error),
      };
    }
  }

  /**
   * 9. GET SETTLEMENTS (Funding/Deposits)
   * GET /v1/settlements or /v1/reports/settlement
   * 
   * Fetches actual funding/deposit data - when money was transferred to merchant bank
   */
  async getSettlements(params?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    status: boolean;
    settlements?: Array<{
      id: string;
      settlement_date: number;
      batch_date: number;
      deposit_date?: number;
      gross_amount: number;
      fee_amount: number;
      net_amount: number;
      transaction_count: number;
      status: string;
      location_id?: string;
    }>;
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page[number]', params.page.toString());
      if (params?.pageSize) queryParams.append('page[size]', (params.pageSize || 50).toString());
      
      // Sort by most recent first
      queryParams.append('sort', '-created_ts');
      
      const url = `settlements${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('[Fortis] Fetching settlements:', url);
      
      const response = await this.client.get(url);
      
      if (response.data?.list && Array.isArray(response.data.list)) {
        return {
          status: true,
          settlements: response.data.list.map((settlement: any) => ({
            id: settlement.id,
            settlement_date: settlement.settlement_date || settlement.created_ts,
            batch_date: settlement.batch_date || settlement.created_ts,
            deposit_date: settlement.deposit_date,
            gross_amount: settlement.gross_amount || settlement.total_amount || 0,
            fee_amount: settlement.fee_amount || settlement.total_fees || 0,
            net_amount: settlement.net_amount || (settlement.gross_amount - settlement.fee_amount) || 0,
            transaction_count: settlement.transaction_count || settlement.count || 0,
            status: settlement.status || (settlement.is_settled ? 'settled' : 'pending'),
            location_id: settlement.location_id,
          })),
        };
      }
      
      return {
        status: true,
        settlements: [],
        message: 'No settlements found',
      };
    } catch (error) {
      console.error('[Fortis] Get settlements error:', error);
      // If settlements endpoint doesn't exist, fall back to transaction batches
      return {
        status: false,
        message: this.formatError(error),
      };
    }
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
  // Normalize environment - support both naming conventions and handle 'dev', 'development', 'test' as 'sandbox'
  const envRaw = environment || process.env.FORTIS_ENVIRONMENT || process.env.fortis_environment || 'sandbox';
  const env = (envRaw === 'production' || envRaw === 'prd' || envRaw === 'prod') 
    ? 'production' 
    : 'sandbox';
  
  // Get credentials from environment variables - support both naming conventions (FORTIS_* and fortis_*)
  // Priority: FORTIS_* (uppercase) first, then fortis_* (lowercase) as fallback
  const developerId = (env === 'sandbox'
    ? (process.env.FORTIS_DEVELOPER_ID_SANDBOX || process.env.fortis_developer_id_sandbox || '').trim()
    : (process.env.FORTIS_DEVELOPER_ID_PRODUCTION || process.env.fortis_developer_id_production || '').trim());
  
  const fortisUserId = userId?.trim() || (env === 'sandbox'
    ? (process.env.FORTIS_USER_ID_SANDBOX || process.env.fortis_onboarding_user_id_sandbox || '').trim()
    : (process.env.FORTIS_USER_ID_PRODUCTION || process.env.fortis_onboarding_user_id_production || '').trim());
  
  const fortisUserApiKey = userApiKey?.trim() || (env === 'sandbox'
    ? (process.env.FORTIS_USER_API_KEY_SANDBOX || process.env.fortis_onboarding_user_api_key_sandbox || '').trim()
    : (process.env.FORTIS_USER_API_KEY_PRODUCTION || process.env.fortis_onboarding_user_api_key_production || '').trim());

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    const maskCredential = (cred: string) => {
      if (!cred || cred.length <= 8) return '***';
      return `${cred.substring(0, 4)}...${cred.substring(cred.length - 4)}`;
    };
    console.log('[Fortis Client] Creating client with:', {
      environment: env,
      developerId: maskCredential(developerId),
      userId: maskCredential(fortisUserId),
      userApiKey: maskCredential(fortisUserApiKey),
      developerIdLength: developerId.length,
      userIdLength: fortisUserId.length,
      userApiKeyLength: fortisUserApiKey.length,
    });
  }

  // Validate all credentials are present
  if (!developerId || !fortisUserId || !fortisUserApiKey) {
    const missing = [];
    if (!developerId) missing.push(`FORTIS_DEVELOPER_ID_${env === 'sandbox' ? 'SANDBOX' : 'PRODUCTION'}`);
    if (!fortisUserId) missing.push(env === 'sandbox' ? 'FORTIS_USER_ID_SANDBOX' : 'FORTIS_USER_ID_PRODUCTION');
    if (!fortisUserApiKey) missing.push(env === 'sandbox' ? 'FORTIS_USER_API_KEY_SANDBOX' : 'FORTIS_USER_API_KEY_PRODUCTION');
    
    const errorMsg = `Fortis API credentials missing. Please set: ${missing.join(', ')}`;
    console.error('[Fortis Client]', errorMsg, {
      env,
      developerIdPresent: !!developerId,
      userIdPresent: !!fortisUserId,
      userApiKeyPresent: !!fortisUserApiKey,
    });
    throw new Error(errorMsg);
  }

  const config: FortisConfig = {
    environment: env,
    developerId,
    userId: fortisUserId,
    userApiKey: fortisUserApiKey,
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

