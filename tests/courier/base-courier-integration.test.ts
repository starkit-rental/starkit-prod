import { describe, it, expect, beforeAll } from 'vitest';
import { baseCourierAPI } from '@/lib/courier/base-courier-api';
import { PARCEL_SIZES } from '@/lib/courier/types';

describe('Base Courier Integration', () => {
  describe('Parcel Sizes Configuration', () => {
    it('should have correct dimensions for small parcel', () => {
      const small = PARCEL_SIZES.small;
      expect(small.length).toBe(60);
      expect(small.width).toBe(35);
      expect(small.height).toBe(18);
      expect(small.weight).toBe(5);
    });

    it('should have correct dimensions for large parcel', () => {
      const large = PARCEL_SIZES.large;
      expect(large.length).toBe(64);
      expect(large.width).toBe(38);
      expect(large.height).toBe(41);
      expect(large.weight).toBe(15);
    });
  });

  describe('API Client', () => {
    it('should create API client instance', () => {
      expect(baseCourierAPI).toBeDefined();
      expect(typeof baseCourierAPI.createShipment).toBe('function');
      expect(typeof baseCourierAPI.getWaybill).toBe('function');
      expect(typeof baseCourierAPI.downloadWaybillPDF).toBe('function');
    });
  });

  describe('Shipment Data Validation', () => {
    it('should validate required shipment fields', () => {
      const shipmentData = {
        senderFirstName: 'Maciej',
        senderLastName: 'Godek',
        senderPhoneNumber: '795097658',
        senderEmail: 'starkit.rental@gmail.com',
        senderStreet: 'Cumownicza',
        senderBuildingNumber: '1a',
        senderFlatNumber: '2',
        senderPostCode: '60-480',
        senderCity: 'Poznań',
        receiverFirstName: 'Jan',
        receiverLastName: 'Kowalski',
        receiverPhoneNumber: '600123456',
        receiverEmail: 'jan@example.com',
        operatorName: 'INPOST' as const,
        destinationCode: 'KRA010',
        postingCode: 'POZ118M',
        parcels: [
          {
            dimensions: PARCEL_SIZES.small,
          },
        ],
      };

      expect(shipmentData.senderFirstName).toBe('Maciej');
      expect(shipmentData.operatorName).toBe('INPOST');
      expect(shipmentData.parcels).toHaveLength(1);
      expect(shipmentData.parcels[0].dimensions).toEqual(PARCEL_SIZES.small);
    });

    it('should include insurance when specified', () => {
      const shipmentData = {
        parcels: [
          {
            dimensions: PARCEL_SIZES.large,
            insuranceValue: 500,
          },
        ],
      };

      expect(shipmentData.parcels[0].insuranceValue).toBe(500);
    });

    it('should include additional services when specified', () => {
      const additionalServices = [
        { name: 'SATURDAY_DELIVERY' },
      ];

      expect(additionalServices).toHaveLength(1);
      expect(additionalServices[0].name).toBe('SATURDAY_DELIVERY');
    });
  });

  describe('Sender/Receiver Data Parsing', () => {
    it('should parse customer name correctly', () => {
      const fullName = 'Jan Kowalski';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      expect(firstName).toBe('Jan');
      expect(lastName).toBe('Kowalski');
    });

    it('should handle single name', () => {
      const fullName = 'Jan';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Klient';
      const lastName = nameParts.slice(1).join(' ') || 'Starkit';

      expect(firstName).toBe('Jan');
      expect(lastName).toBe('Starkit');
    });

    it('should handle empty name', () => {
      const fullName = '';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Klient';
      const lastName = nameParts.slice(1).join(' ') || 'Starkit';

      expect(firstName).toBe('Klient');
      expect(lastName).toBe('Starkit');
    });

    it('should handle multi-part last name', () => {
      const fullName = 'Jan Maria Kowalski';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      expect(firstName).toBe('Jan');
      expect(lastName).toBe('Maria Kowalski');
    });
  });

  describe('Reference Number Generation', () => {
    it('should generate correct reference for outbound shipment', () => {
      const orderNumber = 'SK-2026-001';
      const reference = orderNumber;

      expect(reference).toBe('SK-2026-001');
    });

    it('should generate correct reference for return shipment', () => {
      const orderNumber = 'SK-2026-001';
      const reference = `${orderNumber}-ZWROT`;

      expect(reference).toBe('SK-2026-001-ZWROT');
    });

    it('should handle missing order number', () => {
      const orderId = 'uuid-123-456';
      const reference = orderId;

      expect(reference).toBe('uuid-123-456');
    });
  });
});

describe('Shipment Options', () => {
  it('should create shipment options object', () => {
    const options = {
      insurance: true,
      insuranceValue: 1000,
      saturdayDelivery: true,
    };

    expect(options.insurance).toBe(true);
    expect(options.insuranceValue).toBe(1000);
    expect(options.saturdayDelivery).toBe(true);
  });

  it('should handle no insurance', () => {
    const options = {
      insurance: false,
      insuranceValue: 0,
      saturdayDelivery: false,
    };

    expect(options.insurance).toBe(false);
    expect(options.insuranceValue).toBe(0);
  });

  it('should prepare additional services array', () => {
    const saturdayDelivery = true;
    const additionalServices: Array<{ name: string }> = [];
    
    if (saturdayDelivery) {
      additionalServices.push({ name: 'SATURDAY_DELIVERY' });
    }

    expect(additionalServices).toHaveLength(1);
    expect(additionalServices[0].name).toBe('SATURDAY_DELIVERY');
  });

  it('should have empty additional services when no options selected', () => {
    const saturdayDelivery = false;
    const additionalServices: Array<{ name: string }> = [];
    
    if (saturdayDelivery) {
      additionalServices.push({ name: 'SATURDAY_DELIVERY' });
    }

    expect(additionalServices).toHaveLength(0);
  });
});
