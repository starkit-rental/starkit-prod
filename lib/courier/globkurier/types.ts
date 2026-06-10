// GlobKurier API types and interfaces

export type GlobKurierEnvironment = 'production' | 'test';

export interface GlobKurierConfig {
  email: string;
  password: string;
  environment: GlobKurierEnvironment;
}

export interface GlobKurierAuth {
  token: string;
  expiresAt: number;
}

// Address types
export interface GlobKurierAddress {
  name: string;
  city: string;
  street: string;
  houseNumber: string;
  apartmentNumber?: string;
  postCode: string;
  countryId: number; // 1 = Poland
  pointId?: string; // InPost point ID
  phone: string;
  email: string;
  contactPerson?: string;
}

// Shipment dimensions
export interface GlobKurierShipment {
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weight: number; // kg
  quantity: number;
  productId: number; // carrier product ID
}

// Addon (insurance, COD, etc.)
export interface GlobKurierAddon {
  id: number;
  value?: number;
  bankAccountNumber?: string;
  name?: string;
  addressLine1?: string;
  swiftCode?: string;
}

// Agreements
export interface GlobKurierAgreements {
  receiveElectronicBills: boolean;
  processingPersonalData: boolean;
}

// Collection type
export type GlobKurierCollectionType = 'PICKUP' | 'POINT' | 'CROSSBORDER';

// Purpose
export type GlobKurierPurpose = 'SOLD' | 'GIFT' | 'SAMPLE' | 'NOT_SOLD' | 'PERSONAL_EFFECTS' | 'REPAIR_AND_RETURN';

// Order status
export type GlobKurierOrderStatus = 
  | 'NEW_SHIPMENT' 
  | 'IN_PROGRESS' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'CANCELED' 
  | 'RETURNED_TO_SENDER';

// Create order request
export interface GlobKurierCreateOrderRequest {
  shipment: GlobKurierShipment;
  senderAddress: GlobKurierAddress;
  receiverAddress: GlobKurierAddress;
  content: string;
  paymentId: number; // 2 = prepaid
  agreements: GlobKurierAgreements;
  addons?: GlobKurierAddon[];
  purpose?: GlobKurierPurpose;
  collectionType: GlobKurierCollectionType;
  referenceNumber?: string;
}

// Product (carrier option) from search
export interface GlobKurierProduct {
  id: number;
  name: string;
  carrierName: string;
  carrierLogo?: string;
  priceGross: number;
  priceNet: number;
  currency: string;
  deliveryTime?: string;
  deliveryDays?: number;
  collectionType: GlobKurierCollectionType;
  additionalInfo?: string; // e.g. 'PACZKOMAT'
  addons?: {
    id: number;
    name: string;
    priceGross: number;
    priceNet: number;
    required: boolean;
  }[];
}

// Search products request
export interface GlobKurierSearchProductsRequest {
  senderPostCode: string;
  senderCountryId: number;
  receiverPostCode: string;
  receiverCountryId: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  collectionType?: GlobKurierCollectionType;
  senderPointId?: string;
  receiverPointId?: string;
}

// Order response
export interface GlobKurierOrderResponse {
  number: string; // e.g. GK240610123456
  status: GlobKurierOrderStatus;
  creationDate: string;
  pricing: {
    priceGross: number;
    priceNet: number;
    vatPercent: number;
    currency: string;
  };
  trackingNumber?: string;
  trackingUrl?: string;
}

// Label response
export interface GlobKurierLabelResponse {
  type: 'WAYBILL' | 'PROTOCOL';
  format: 'PDF' | 'ZPL';
  content: string; // base64
}

// API error response
export interface GlobKurierErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Parcel sizes (same as Base Courier)
export type ParcelSize = 'small' | 'large';

export interface ParcelDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export const PARCEL_SIZES: Record<ParcelSize, ParcelDimensions> = {
  small: {
    length: 60,
    width: 35,
    height: 18,
    weight: 5,
  },
  large: {
    length: 64,
    width: 38,
    height: 41,
    weight: 15,
  },
};

// Sender config (shared with Base Courier)
export interface SenderConfig {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  street: string;
  buildingNumber: string;
  flatNumber: string;
  postCode: string;
  city: string;
  postingCode: string; // InPost point ID
}
