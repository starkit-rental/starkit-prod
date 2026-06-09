import { getApiUrl, getApiKey, getApiLogin } from './base-courier-config';
import type { CreateShipmentRequest, ShipmentResponse, WaybillResponse } from './types';

class BaseCourierAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'BaseCourierAPIError';
  }
}

/**
 * Base Courier API Client
 * Documentation: https://api.blpaczka.com/output.json
 */
export class BaseCourierAPI {
  private apiUrl: string;
  private apiKey: string;
  private apiLogin: string;

  constructor(apiKey?: string, apiLogin?: string) {
    this.apiUrl = getApiUrl();
    this.apiKey = apiKey || getApiKey();
    this.apiLogin = apiLogin || getApiLogin();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    try {
      console.log('[BaseCourierAPI] Request:', { url, method: options.method || 'GET', body: options.body });
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('[BaseCourierAPI] Response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      let data: any;
      if (isJson) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('[BaseCourierAPI] Non-JSON response:', text);
        data = { error: text };
      }

      console.log('[BaseCourierAPI] Response data:', data);

      if (!response.ok) {
        throw new BaseCourierAPIError(
          data.message || data.error || `API request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof BaseCourierAPIError) {
        throw error;
      }
      throw new BaseCourierAPIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a shipment (V2 - supports multiple shipments)
   * POST /api/createOrderV2.json
   */
  async createShipment(orderData: Omit<CreateShipmentRequest, 'auth'>): Promise<ShipmentResponse> {
    const requestData: CreateShipmentRequest = {
      auth: {
        login: this.apiLogin,
        api_key: this.apiKey,
      },
      ...orderData,
    };
    
    return this.request<ShipmentResponse>('/api/createOrderV2.json', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * Get waybill (label) for a shipment
   * POST /api/getWaybill.json
   */
  async getWaybill(waybillNo: number): Promise<WaybillResponse> {
    return this.request<WaybillResponse>('/api/getWaybill.json', {
      method: 'POST',
      body: JSON.stringify({
        auth: {
          login: this.apiLogin,
          api_key: this.apiKey,
        },
        Order: {
          waybill_no: waybillNo,
        },
      }),
    });
  }

  /**
   * Download waybill PDF from URL or base64
   */
  async downloadWaybillPDF(labelUrl?: string, labelBase64?: string): Promise<Buffer> {
    if (labelBase64) {
      return Buffer.from(labelBase64, 'base64');
    }
    
    if (!labelUrl) {
      throw new BaseCourierAPIError('No label URL or base64 data provided');
    }
    
    const waybillUrl = labelUrl;
    const response = await fetch(waybillUrl);
    
    if (!response.ok) {
      throw new BaseCourierAPIError(
        `Failed to download waybill: ${response.status}`,
        response.status
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Export singleton instance
export const baseCourierAPI = new BaseCourierAPI();
