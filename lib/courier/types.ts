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

export interface BaseCourierSearch {
  courier_id?: string; // Courier ID (will be determined by API)
  courier_type?: string; // e.g. 'inpost_paczkomaty'
  cart_sum?: number; // Cart value (required for some couriers)
}

export interface CreateShipmentRequest {
  auth: BaseCourierAuth;
  Order: BaseCourierOrder;
  CourierSearch?: BaseCourierSearch;
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
