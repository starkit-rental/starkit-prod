// Base Courier API types and interfaces

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
  nip?: string; // Tax ID (optional)
}

export interface ReceiverData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  destinationCode: string; // InPost point ID
}

// New Base Courier (BLPaczka) API types
export interface BaseCourierAuth {
  login: string;
  api_key: string;
}

export interface BaseCourierOrder {
  name: string; // Sender full name
  email: string; // Sender email
  phone: string; // Sender phone
  street: string; // Sender street
  house_no: string; // Sender building number
  locum_no?: string; // Sender flat number
  postal: string; // Sender postal code
  city: string; // Sender city
  sender_point?: string; // Sender parcel locker code (for InPost)
  
  taker_name: string; // Receiver full name
  taker_email: string; // Receiver email
  taker_phone: string; // Receiver phone
  taker_street?: string; // Receiver street (optional for parcel locker)
  taker_house_no?: string; // Receiver building number
  taker_locum_no?: string; // Receiver flat number
  taker_postal?: string; // Receiver postal code
  taker_city?: string; // Receiver city
  taker_point?: string; // Receiver parcel locker code (for InPost)
  
  package_content: string; // Package description
  ref_number?: string; // Reference number (order number)
  account?: string; // Bank account for COD
  
  // Package dimensions
  height?: number;
  width?: number;
  depth?: number;
  weight?: number;
  
  // Additional options
  cod?: number; // Cash on delivery amount
  insurance?: number; // Insurance value
  inpost_weekend?: boolean; // Saturday delivery
}

// CourierSearchDto - required fields: weight, type, side_x, side_y, side_z, origin
export interface BaseCourierSearch {
  courier_code: string; // e.g. 'paczkomaty', 'dpd', 'inpost', etc.
  type: string; // 'package' | 'pallet' | 'envelope' | 'not_standard'
  weight: number; // Weight in kg
  side_x: number; // Side X in cm
  side_y: number; // Side Y in cm
  side_z: number; // Side Z in cm
  origin?: string; // Order source identifier
  foreign?: string; // 'local' | 'foreign'
  no_pickup?: boolean; // No courier pickup (self-delivery to point)
  cover?: number; // Insurance amount
  saturday_delivery?: boolean;
  synchronous_label?: boolean; // Create label synchronously with order
  is_return?: boolean; // Is return shipment
}

// CartDto - wraps Order
export interface BaseCourierCart {
  Order: BaseCourierOrder;
}

// CartOrderDto - payment method
export interface BaseCourierPayment {
  payment: 'bank' | 'pay_later'; // 'bank' = prepaid, 'pay_later' = deferred
}

// Full createOrderV2 request
export interface CreateShipmentRequest {
  auth: BaseCourierAuth;
  Cart: BaseCourierCart[]; // Array of CartDto!
  CourierSearch: BaseCourierSearch;
  CartOrder: BaseCourierPayment;
}

export interface ShipmentResponse {
  success: boolean;
  data?: {
    Order?: {
      id: string;
      waybill_no: string; // Tracking number
      created: string;
      price: number;
      price_netto: number;
      vat_value: number;
      courier_name: string;
      courier_id: number;
      name: string; // Sender name
      taker_name: string; // Receiver name
    };
  };
  message?: string;
}

export interface WaybillResponse {
  success: boolean;
  data?: {
    label_url?: string;
    label_base64?: string;
  };
  message?: string;
}
