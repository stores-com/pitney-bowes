# pitney-bowes

[![Build Status](https://github.com/stores-com/pitney-bowes/actions/workflows/test.yml/badge.svg)](https://github.com/stores-com/pitney-bowes/actions)
[![Coverage Status](https://coveralls.io/repos/github/stores-com/pitney-bowes/badge.svg)](https://coveralls.io/github/stores-com/pitney-bowes)

The Pitney Bowes Complete Shipping APIs let you integrate shipping services from multiple carriers, including USPS, into your services and applications.

https://docs.shippingapi.pitneybowes.com

## Usage

```javascript
const PitneyBowes = require('pitney-bowes');

const pitneyBowes = new PitneyBowes({
    api_key: 'your_api_key',
    api_secret: 'your_api_secret',
    baseUrl: 'https://shipping-api-sandbox.pitneybowes.com/shippingservices'
});
```

### pitneyBowes.createShipment(shipment, options)

This operation creates a shipment and purchases a shipment label. The API returns the label as either a Base64 string or a link to a PDF.

**Example**

```javascript
const shipment = {
    documents: [
        {
            contentType: 'BASE64',
            fileFormat: 'ZPL2',
            printDialogOption: 'NO_PRINT_DIALOG',
            size: 'DOC_6X4',
            type: 'SHIPPING_LABEL'
        }
    ],
    fromAddress: {
        addressLines: ['4750 Walnut Street'],
        cityTown: 'Boulder',
        countryCode: 'US',
        name: 'Pitney Bowes',
        postalCode: '80301',
        stateProvince: 'CO'
    },
    parcel: {
        dimension: {
            height: 9,
            length: 12,
            unitOfMeasurement: 'IN',
            width: 0.25
        },
        weight: {
            unitOfMeasurement: 'OZ',
            weight: 3
        }
    },
    rates: [
        {
            carrier: 'PBPRESORT',
            parcelType: 'LGENV',
            serviceId: 'BPM'
        }
    ],
    shipmentOptions: [
        {
            name: 'PERMIT_NUMBER',
            value: '1234'
        },
        {
            name: 'SHIPPER_ID',
            value: '9015544760'
        }
    ],
    toAddress: {
        addressLines: ['114 Whitney Ave'],
        cityTown: 'New Haven',
        countryCode: 'US',
        name: 'John Doe',
        postalCode: '06510',
        stateProvince: 'CT'
    }
};

const options = {
    integratorCarrierId: '987654321',
    shipmentGroupId: '500002',
    transactionId: crypto.randomBytes(12).toString('hex')
};

const result = await pitneyBowes.createShipment(shipment, options);
console.log(result);
```

### pitneyBowes.createManifest(manifest, options)

This operation creates a manifest for carrier pickup.

**Example**

```javascript
const manifest = {
    carrier: 'USPS',
    submissionDate: '2026-04-07',
    parameters: [
        {
            name: 'SHIPPER_ID',
            value: '9015544760'
        }
    ]
};

const options = {
    transactionId: crypto.randomBytes(12).toString('hex')
};

const result = await pitneyBowes.createManifest(manifest, options);
console.log(result);
```

### pitneyBowes.getOAuthToken()

Each request to the PB Complete Shipping APIs requires authentication via an OAuth token. This API call generates the OAuth token based on the Base64-encoded value of the API key and secret associated with your PB Complete Shipping APIs developer account. The token expires after 10 hours, after which you must create a new one. Tokens are cached automatically.

**Example**

```javascript
const oAuthToken = await pitneyBowes.getOAuthToken();
console.log(oAuthToken);
```

### pitneyBowes.rate(shipment, options)

This operation retrieves shipping rate quotes.

**Example**

```javascript
const shipment = {
    fromAddress: {
        addressLines: ['4750 Walnut Street'],
        cityTown: 'Boulder',
        countryCode: 'US',
        name: 'Pitney Bowes',
        postalCode: '80301',
        stateProvince: 'CO'
    },
    parcel: {
        weight: {
            unitOfMeasurement: 'OZ',
            weight: 3
        }
    },
    rates: [
        {
            carrier: 'USPS'
        }
    ],
    toAddress: {
        addressLines: ['114 Whitney Ave'],
        cityTown: 'New Haven',
        countryCode: 'US',
        name: 'John Doe',
        postalCode: '06510',
        stateProvince: 'CT'
    }
};

const result = await pitneyBowes.rate(shipment);
console.log(result);
```

### pitneyBowes.tracking(args)

Shipment labels that are printed using the PB Complete Shipping APIs are automatically tracked. This operation retrieves package status for a label.

**Example**

```javascript
const data = await pitneyBowes.tracking({ carrier: 'USPS', trackingNumber: 'trackingNumber' });
console.log(data);
```

### pitneyBowes.validateAddress(args)

Address validation verifies and cleanses postal addresses within the United States to help ensure packages are rated accurately and shipments arrive at their final destinations on time. The Validate Address operation sends an address to be verified. The response indicates whether the address is valid and whether the validation check made changes to the address.

**Example**

```javascript
const address = {
    addressLines: [
        '1600 Pennsylvania Avenue NW'
    ],
    cityTown: 'Washington',
    stateProvince: 'DC',
    postalCode: '20500 ',
    countryCode: 'US',
    company: 'Pitney Bowes Inc.',
    name: 'John Doe',
    phone: '203-000-0000',
    email: 'john.d@example.com'
};

const data = await pitneyBowes.validateAddress({ address, minimalAddressValidation: false });
console.log(data);
```
