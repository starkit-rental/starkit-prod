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

export interface CreateShipmentRequest {
  number?: string;
  senderFirstName: string;
  senderLastName: string;
  senderPhoneNumber: string;
  senderEmail: string;
  senderStreet: string;
  senderBuildingNumber: string;
  senderFlatNumber: string;
  senderPostCode: string;
  senderCity: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverPhoneNumber: string;
  receiverEmail: string;
  operatorName: 'INPOST';
  destinationCode: string;
  postingCode: string;
  additionalInformation?: string;
  reference?: string;
  parcels: Array<{
    dimensions: {
      height: number;
      length: number;
      width: number;
      weight: number;
    };
    insuranceValue?: number;
  }>;
  additionalServices?: Array<{
    name: string;
  }>;
}

export interface ShipmentResponse {
  number: string;
  senderFirstName: string;
  senderLastName: string;
  senderPhoneNumber: string;
  senderEmail: string;
  senderStreet: string;
  senderBuildingNumber: string;
  senderFlatNumber: string;
  senderPostCode: string;
  senderCity: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverPhoneNumber: string;
  receiverEmail: string;
  receiverStreet?: string;
  receiverBuildingNumber?: string;
  receiverFlatNumber?: string;
  receiverPostCode?: string;
  receiverCity?: string;
  receiverCountryCode: string;
  operatorName: string;
  destinationCode: string;
  postingCode: string;
  additionalInformation?: string;
  reference?: string;
  parcels: Array<{
    dimensions: {
      length: number;
      height: number;
      width: number;
      weight: number;
    };
  }>;
  status: string;
  deliveryType: string;
  creationDate: string;
  adviceDate: string | null;
  trackingNumber: string | null;
  postingPostCode?: string;
  postingCity?: string;
  postingStreet?: string;
  destinationPostCode?: string;
  destinationCity?: string;
  destinationStreet?: string;
  price?: {
    net: number;
    vat: number;
    gross: number;
  } | null;
}

export interface WaybillResponse {
  url: string;
}
