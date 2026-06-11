// GlobKurier API Client

import { getApiUrl } from './config';
import type {
  GlobKurierEnvironment,
  GlobKurierAuth,
  GlobKurierCreateOrderRequest,
  GlobKurierBestPriceRequest,
  GlobKurierOrderResponse,
  GlobKurierProduct,
  GlobKurierSearchProductsRequest,
  GlobKurierLabelResponse,
  GlobKurierErrorResponse,
} from './types';

class GlobKurierAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'GlobKurierAPIError';
  }
}

// Token cache (in-memory, per instance)
let tokenCache: GlobKurierAuth | null = null;

/**
 * GlobKurier API Client
 * Documentation: https://developer.globkurier.pl/
 */
export class GlobKurierAPI {
  private apiUrl: string;
  private email: string;
  private password: string;

  constructor(email: string, password: string, environment: GlobKurierEnvironment = 'test') {
    this.apiUrl = getApiUrl(environment);
    this.email = email;
    this.password = password;
  }

  /**
   * Get valid auth token (login or use cached)
   */
  private async getToken(): Promise<string> {
    // Check if cached token is still valid (with 5 min buffer)
    if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
      return tokenCache.token;
    }

    // Login to get new token
    const response = await fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'pl',
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new GlobKurierAPIError(
        error.message || 'Authentication failed',
        response.status,
        error.code
      );
    }

    const data = await response.json();
    
    // Cache token (assume 1 hour validity)
    tokenCache = {
      token: data.token,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };

    return data.token;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${this.apiUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': 'pl',
      'X-Auth-Token': token,
      ...options.headers,
    };

    try {
      console.log('[GlobKurierAPI] Request:', { url, method: options.method || 'GET' });

      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('[GlobKurierAPI] Response status:', response.status);

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      let data: any;
      if (isJson) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('[GlobKurierAPI] Non-JSON response:', text.substring(0, 200));
        data = { error: text };
      }

      if (!response.ok) {
        const errorData = data as GlobKurierErrorResponse & {
          errors?: any;
          violations?: any;
          error?: string;
        };
        console.error('[GlobKurierAPI] Error response body:', JSON.stringify(data, null, 2));

        // Build a detailed message from whatever fields the API returned
        let detailMessage =
          errorData.message ||
          errorData.error ||
          `API request failed with status ${response.status}`;

        // Append validation details if present
        const validation = errorData.errors || errorData.violations || errorData.details;
        if (validation) {
          detailMessage += ` | Details: ${JSON.stringify(validation)}`;
        }

        throw new GlobKurierAPIError(
          detailMessage,
          response.status,
          errorData.code,
          errorData.details
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof GlobKurierAPIError) {
        throw error;
      }
      throw new GlobKurierAPIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search available carrier products
   * GET /v1/products
   */
  async searchProducts(params: GlobKurierSearchProductsRequest): Promise<GlobKurierProduct[]> {
    const queryParams = new URLSearchParams({
      senderPostCode: params.senderPostCode,
      senderCountryId: String(params.senderCountryId),
      receiverPostCode: params.receiverPostCode,
      receiverCountryId: String(params.receiverCountryId),
      length: String(params.length),
      width: String(params.width),
      height: String(params.height),
      weight: String(params.weight),
      quantity: '1',
      packageType: 'PARCEL',
      transportType: 'ROAD',
      flatList: 'true',
    });

    // Collection/delivery types are arrays in the API (collectionTypes[]=...)
    const collectionType = params.collectionType || 'POINT';
    queryParams.append('collectionTypes[]', collectionType);
    queryParams.append('deliveryTypes[]', collectionType);

    // Note: senderPointId and receiverPointId are NOT supported in /products endpoint
    // They are only used when creating orders via /order or /order/bestPrice

    const response = await this.request<any>(`/products?${queryParams.toString()}`);

    // flatList=true may return a plain array, or wrapped in items/products
    const items: any[] = Array.isArray(response)
      ? response
      : response.items || response.products || response.data || [];

    return items.map((item: any) => ({
      id: item.id,
      name: item.name || item.packageName || '',
      carrierName: item.carrierName || item.carrier?.name || 'Unknown',
      carrierLogo: item.carrierLogoLink || item.carrierLogo || item.carrier?.logo,
      priceGross: item.grossPrice ?? item.priceGross ?? item.pricing?.priceGross ?? 0,
      priceNet: item.netPrice ?? item.priceNet ?? item.pricing?.priceNet ?? 0,
      currency:
        typeof item.currency === 'string'
          ? item.currency
          : item.currency?.code || 'PLN',
      deliveryTime: item.deliveryTime,
      deliveryDays: item.averageDelivery ?? item.deliveryDays,
      collectionType: item.collectionType || collectionType,
      additionalInfo: item.serviceCode || item.additionalInfo,
      addons: item.addons,
    }));
  }

  /**
   * Create order
   * POST /v1/order
   */
  async createOrder(orderData: GlobKurierCreateOrderRequest): Promise<GlobKurierOrderResponse> {
    console.log('[GlobKurierAPI] Creating order:', JSON.stringify(orderData, null, 2));
    
    const response = await this.request<any>('/order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    console.log('[GlobKurierAPI] Order created:', response);

    return {
      number: response.number,
      status: response.status || 'NEW_SHIPMENT',
      creationDate: response.creationDate,
      pricing: {
        priceGross: response.pricing?.priceGross || 0,
        priceNet: response.pricing?.priceNet || 0,
        vatPercent: response.pricing?.vatPercent || 23,
        currency: response.pricing?.currency || 'PLN',
      },
      trackingNumber: response.trackingNumber,
      trackingUrl: response.trackingUrl,
    };
  }

  /**
   * Create order using simplified bestPrice endpoint.
   * Automatically finds the best matching product/carrier.
   * POST /v1/order/bestPrice?createFully=true&onlyPricing=false
   */
  async createOrderBestPrice(
    orderData: GlobKurierBestPriceRequest,
    options: { onlyPricing?: boolean } = {}
  ): Promise<GlobKurierOrderResponse> {
    const onlyPricing = options.onlyPricing ?? false;
    const createFully = !onlyPricing;

    console.log('[GlobKurierAPI] bestPrice request:', JSON.stringify(orderData, null, 2));

    const response = await this.request<any>(
      `/order/bestPrice?createFully=${createFully}&onlyPricing=${onlyPricing}`,
      {
        method: 'POST',
        body: JSON.stringify(orderData),
      }
    );

    console.log('[GlobKurierAPI] bestPrice response:', JSON.stringify(response, null, 2));

    // Response may contain order data (createFully) and/or pricing
    const priceGross = response.totalGrossPrice ?? response.pricing?.priceGross ?? 0;
    const priceNet = response.totalNetPrice ?? response.pricing?.priceNet ?? 0;
    const currency = response.currency ?? response.pricing?.currency ?? 'PLN';
    const vatPercent = response.vatPercent ?? response.pricing?.vatPercent ?? 23;

    // Order number can be in different fields depending on createFully
    const orderNumber =
      response.number ||
      response.orderNumber ||
      response.order?.number ||
      (Array.isArray(response.orders) ? response.orders[0]?.number : undefined) ||
      '';

    const trackingNumber =
      response.trackingNumber ||
      response.order?.trackingNumber ||
      (Array.isArray(response.orders) ? response.orders[0]?.trackingNumber : undefined);

    return {
      number: orderNumber,
      status: response.status || response.order?.status || 'NEW_SHIPMENT',
      creationDate: response.creationDate || new Date().toISOString(),
      pricing: {
        priceGross,
        priceNet,
        vatPercent,
        currency,
      },
      trackingNumber,
      trackingUrl: response.trackingUrl,
    };
  }

  /**
   * Get order details
   * GET /v1/order/{orderNumber}
   */
  async getOrder(orderNumber: string): Promise<GlobKurierOrderResponse> {
    return this.request<GlobKurierOrderResponse>(`/order/${orderNumber}`);
  }

  /**
   * Get order labels (waybill PDF)
   * GET /v1/order/{orderNumber}/labels
   */
  async getLabels(orderNumber: string): Promise<GlobKurierLabelResponse[]> {
    const response = await this.request<{ items: any[] }>(`/order/${orderNumber}/labels`);
    
    return (response.items || []).map((item: any) => ({
      type: item.type || 'WAYBILL',
      format: item.format || 'PDF',
      content: item.content, // base64
    }));
  }

  /**
   * Get order status
   * GET /v1/order/{orderNumber}/status
   */
  async getOrderStatus(orderNumber: string): Promise<{ status: string; events: any[] }> {
    return this.request<{ status: string; events: any[] }>(`/order/${orderNumber}/status`);
  }

  /**
   * Cancel order
   * DELETE /v1/order/{orderNumber}
   */
  async cancelOrder(orderNumber: string): Promise<void> {
    await this.request<void>(`/order/${orderNumber}`, {
      method: 'DELETE',
    });
  }

  /**
   * Test connection (login)
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear token cache (for logout/refresh)
   */
  clearTokenCache(): void {
    tokenCache = null;
  }
}

// Factory function to create API instance from site_settings
export async function createGlobKurierAPI(
  supabase: any
): Promise<GlobKurierAPI | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['globkurier_email', 'globkurier_password', 'globkurier_environment']);

  if (!data || data.length === 0) {
    return null;
  }

  const settings = new Map(data.map((s: any) => [s.key, s.value]));
  const email = settings.get('globkurier_email');
  const password = settings.get('globkurier_password');
  const environment = (settings.get('globkurier_environment') || 'test') as GlobKurierEnvironment;

  if (!email || !password) {
    return null;
  }

  return new GlobKurierAPI(email as string, password as string, environment);
}
