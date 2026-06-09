import { getApiUrl, getApiKey } from './base-courier-config';
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
 * Documentation: https://docs.bliskapaczka.pl/
 */
export class BaseCourierAPI {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiUrl = getApiUrl();
    this.apiKey = apiKey || getApiKey();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
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
   * Create and advice a shipment
   * POST /v2/order/advice
   */
  async createShipment(data: CreateShipmentRequest): Promise<ShipmentResponse> {
    return this.request<ShipmentResponse>('/order/advice', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get waybill URL for a shipment
   * GET /v2/order/{number}/waybill
   */
  async getWaybill(orderNumber: string): Promise<WaybillResponse[]> {
    return this.request<WaybillResponse[]>(`/order/${orderNumber}/waybill`);
  }

  /**
   * Get shipment details
   * GET /v2/order/{number}
   */
  async getShipment(orderNumber: string): Promise<ShipmentResponse> {
    return this.request<ShipmentResponse>(`/order/${orderNumber}`);
  }

  /**
   * Get tracking information
   * GET /v2/order/{number}/tracking
   */
  async getTracking(orderNumber: string): Promise<any> {
    return this.request<any>(`/order/${orderNumber}/tracking`);
  }

  /**
   * Download waybill PDF as buffer
   */
  async downloadWaybillPDF(waybillUrl: string): Promise<Buffer> {
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
