const assert = require('node:assert');
const crypto = require('crypto');
const test = require('node:test');

const cache = require('memory-cache');

const HttpError = require('@stores.com/http-error');
const PitneyBowes = require('../index');

test('PitneyBowes.createShipment', { concurrency: true, timeout: 30000 }, async (t) => {
    t.beforeEach(() => cache.clear());

    await t.test('should throw for invalid baseUrl', async () => {
        const pitneyBowes = new PitneyBowes({ baseUrl: 'invalid' });

        await assert.rejects(pitneyBowes.createShipment({}, {}), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for invalid baseUrl with cached token', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const token = await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'invalid'
        });

        cache.put(`pitneybowes:oauth:${process.env.API_KEY}`, token, token.expiresIn * 1000 / 2);

        await assert.rejects(pb2.createShipment({}, {}), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for non 200 status code', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'https://httpbingo.org/status/500#'
        });

        await assert.rejects(pb2.createShipment({}, {}), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should throw when no shipment is specified', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await assert.rejects(pitneyBowes.createShipment({}, {}), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should return a valid response', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

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

        const result = await pitneyBowes.createShipment(shipment, {
            integratorCarrierId: '987654321',
            shipmentGroupId: '500002',
            transactionId: crypto.randomBytes(12).toString('hex')
        });

        assert(result.documents[0].pages[0].contents);
    });
});

test('PitneyBowes.createManifest', { concurrency: true, timeout: 30000 }, async (t) => {
    t.beforeEach(() => cache.clear());

    await t.test('should throw for invalid baseUrl', async () => {
        const pitneyBowes = new PitneyBowes({ baseUrl: 'invalid' });

        await assert.rejects(pitneyBowes.createManifest({}, {}), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for invalid baseUrl with cached token', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const token = await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'invalid'
        });

        cache.put(`pitneybowes:oauth:${process.env.API_KEY}`, token, token.expiresIn * 1000 / 2);

        await assert.rejects(pb2.createManifest({}, {}), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for non 200 status code', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'https://httpbingo.org/status/500#'
        });

        await assert.rejects(pb2.createManifest({}, {}), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should throw when no manifest is specified', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await assert.rejects(pitneyBowes.createManifest({}, {}), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should return a valid response', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        // Create a shipment first so the manifest has something to include
        await pitneyBowes.createShipment({
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
        }, {
            integratorCarrierId: '987654321',
            shipmentGroupId: '500002',
            transactionId: crypto.randomBytes(12).toString('hex')
        });

        const result = await pitneyBowes.createManifest({
            carrier: 'PBPRESORT',
            fromAddress: {
                addressLines: ['4750 Walnut Street'],
                cityTown: 'Boulder',
                countryCode: 'US',
                name: 'Pitney Bowes',
                postalCode: '80301',
                stateProvince: 'CO'
            },
            submissionDate: new Date().toISOString().split('T')[0],
            parameters: [
                {
                    name: 'SHIPPER_ID',
                    value: '9015544760'
                }
            ]
        }, {
            integratorCarrierId: '987654321',
            transactionId: crypto.randomBytes(12).toString('hex')
        });

        assert(result);
    });
});

test('PitneyBowes.getOAuthToken', { concurrency: true, timeout: 30000 }, async (t) => {
    t.beforeEach(() => cache.clear());

    await t.test('should throw for invalid baseUrl', async () => {
        const pitneyBowes = new PitneyBowes({ baseUrl: 'invalid' });

        await assert.rejects(pitneyBowes.getOAuthToken(), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for non 200 status code', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
            baseUrl: 'https://httpbingo.org/status/500#'
        });

        await assert.rejects(pitneyBowes.getOAuthToken(), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should return a valid oAuthToken', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const oAuthToken = await pitneyBowes.getOAuthToken();

        assert(oAuthToken);
        assert(oAuthToken.access_token);
        assert(oAuthToken.clientID);
        assert(oAuthToken.expiresIn);
        assert(oAuthToken.issuedAt);
        assert(oAuthToken.org);
        assert.strictEqual(oAuthToken.tokenType, 'BearerToken');
    });

    await t.test('should return the same token on subsequent calls', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const token1 = await pitneyBowes.getOAuthToken();
        const token2 = await pitneyBowes.getOAuthToken();

        assert.deepStrictEqual(token1, token2);
    });
});

test('PitneyBowes.rate', { concurrency: true, timeout: 30000 }, async (t) => {
    t.beforeEach(() => cache.clear());

    await t.test('should throw for invalid baseUrl', async () => {
        const pitneyBowes = new PitneyBowes({ baseUrl: 'invalid' });

        await assert.rejects(pitneyBowes.rate({}, {}), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for invalid baseUrl with cached token', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const token = await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'invalid'
        });

        cache.put(`pitneybowes:oauth:${process.env.API_KEY}`, token, token.expiresIn * 1000 / 2);

        await assert.rejects(pb2.rate({}, {}), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for non 200 status code', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'https://httpbingo.org/status/500#'
        });

        await assert.rejects(pb2.rate({}, {}), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should throw when no shipment is specified', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await assert.rejects(pitneyBowes.rate({}, {}), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should return a valid response', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

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

        const result = await pitneyBowes.rate(shipment, {
            integratorCarrierId: '987654321',
            shipmentGroupId: '500002',
            transactionId: crypto.randomBytes(12).toString('hex')
        });

        assert(result.rates.length > 0);
    });
});

test('PitneyBowes.tracking', { concurrency: true, timeout: 30000 }, async (t) => {
    t.beforeEach(() => cache.clear());

    await t.test('should throw for invalid baseUrl', async () => {
        const pitneyBowes = new PitneyBowes({ baseUrl: 'invalid' });

        await assert.rejects(pitneyBowes.tracking({ carrier: 'USPS', trackingNumber: '4206311892612927005269000081323326' }), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for invalid baseUrl with cached token', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const token = await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'invalid'
        });

        cache.put(`pitneybowes:oauth:${process.env.API_KEY}`, token, token.expiresIn * 1000 / 2);

        await assert.rejects(pb2.tracking({ carrier: 'USPS', trackingNumber: '4206311892612927005269000081323326' }), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for non 200 status code', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'https://httpbingo.org/status/500#'
        });

        await assert.rejects(pb2.tracking({ carrier: 'USPS', trackingNumber: '4206311892612927005269000081323326' }), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should throw when no tracking number is specified', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await assert.rejects(pitneyBowes.tracking({ carrier: 'FDR' }), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should return tracking events', async (t) => {
        const originalFetch = global.fetch;

        t.mock.method(global, 'fetch', async (url, options) => {
            if (typeof url === 'string' && url.includes('/v1/tracking/9234690390809100255164')) {
                return new Response(JSON.stringify({
                    packageCount: 1,
                    trackingNumber: '9234690390809100255164',
                    carrier: 'USPS',
                    serviceName: 'USPS Ground Advantage',
                    deliveryDate: '2026-03-30',
                    deliveryTime: '10:45:00',
                    deliveryTimeOffset: '-05:00',
                    deliveryLocation: 'SPRING BRANCH,TX,78070',
                    deliveryLocationDescription: 'Delivered, In/At Mailbox',
                    scanDetailsList: [
                        {
                            standardizedEventCode: 'DLD',
                            scanDescription: 'Delivered, In/At Mailbox',
                            packageStatus: 'Delivered',
                            eventDate: '2026-03-30',
                            eventTime: '10:45:00',
                            eventCity: 'SPRING BRANCH',
                            eventStateOrProvince: 'TX',
                            postalCode: '78070'
                        },
                        {
                            standardizedEventCode: 'OFD',
                            scanDescription: 'Out for Delivery',
                            packageStatus: 'OutForDelivery',
                            eventDate: '2026-03-30',
                            eventTime: '07:12:00',
                            eventCity: 'SPRING BRANCH',
                            eventStateOrProvince: 'TX',
                            postalCode: '78070'
                        },
                        {
                            standardizedEventCode: 'TRD',
                            scanDescription: 'Arrived at Post Office',
                            packageStatus: 'InTransit',
                            eventDate: '2026-03-30',
                            eventTime: '07:01:00',
                            eventCity: 'SPRING BRANCH',
                            eventStateOrProvince: 'TX',
                            postalCode: '78070'
                        },
                        {
                            standardizedEventCode: 'PSR',
                            scanDescription: 'Shipping Label Created, USPS Awaiting Item',
                            packageStatus: 'Manifest',
                            eventDate: '2026-03-27',
                            eventTime: '09:41:00',
                            eventCity: 'ELK GROVE VILLAGE',
                            eventStateOrProvince: 'IL',
                            postalCode: '60007'
                        }
                    ],
                    currentStatus: {
                        standardizedEventCode: 'DLD',
                        scanDescription: 'Delivered, In/At Mailbox',
                        packageStatus: 'Delivered',
                        eventCity: 'SPRING BRANCH',
                        eventStateOrProvince: 'TX',
                        postalCode: '78070'
                    },
                    status: 'Delivered'
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            return originalFetch(url, options);
        });

        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const data = await pitneyBowes.tracking({ carrier: 'USPS', trackingNumber: '9234690390809100255164' });

        assert.strictEqual(data.trackingNumber, '9234690390809100255164');
        assert.strictEqual(data.carrier, 'USPS');
        assert.strictEqual(data.status, 'Delivered');
        assert.strictEqual(data.scanDetailsList.length, 4);
        assert.strictEqual(data.scanDetailsList[0].packageStatus, 'Delivered');
        assert.strictEqual(data.scanDetailsList[0].eventCity, 'SPRING BRANCH');
        assert.strictEqual(data.scanDetailsList[3].packageStatus, 'Manifest');
        assert.strictEqual(data.currentStatus.packageStatus, 'Delivered');
    });
});

test('PitneyBowes.validateAddress', { concurrency: true, timeout: 30000 }, async (t) => {
    t.beforeEach(() => cache.clear());

    await t.test('should throw for invalid baseUrl', async () => {
        const pitneyBowes = new PitneyBowes({ baseUrl: 'invalid' });

        const address = {
            addressLines: ['1600 Pennsylvania Avenue NW'],
            cityTown: 'Washington',
            stateProvince: 'DC',
            postalCode: '20500 ',
            countryCode: 'US',
            company: 'Pitney Bowes Inc.',
            name: 'John Doe',
            phone: '203-000-0000',
            email: 'john.d@example.com',
            residential: false
        };

        await assert.rejects(pitneyBowes.validateAddress({ address }), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for invalid baseUrl with cached token', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const token = await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'invalid'
        });

        cache.put(`pitneybowes:oauth:${process.env.API_KEY}`, token, token.expiresIn * 1000 / 2);

        const address = {
            addressLines: ['1600 Pennsylvania Avenue NW'],
            cityTown: 'Washington',
            stateProvince: 'DC',
            postalCode: '20500 ',
            countryCode: 'US',
            company: 'Pitney Bowes Inc.',
            name: 'John Doe',
            phone: '203-000-0000',
            email: 'john.d@example.com',
            residential: false
        };

        await assert.rejects(pb2.validateAddress({ address }), (err) => {
            assert(err instanceof TypeError);
            return true;
        });
    });

    await t.test('should throw for non 200 status code', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await pitneyBowes.getOAuthToken();

        const pb2 = new PitneyBowes({
            api_key: process.env.API_KEY,
            baseUrl: 'https://httpbingo.org/status/500#'
        });

        const address = {
            addressLines: ['1600 Pennsylvania Avenue NW'],
            cityTown: 'Washington',
            stateProvince: 'DC',
            postalCode: '20500 ',
            countryCode: 'US',
            company: 'Pitney Bowes Inc.',
            name: 'John Doe',
            phone: '203-000-0000',
            email: 'john.d@example.com',
            residential: false
        };

        await assert.rejects(pb2.validateAddress({ address }), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should throw when no address is specified', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        await assert.rejects(pitneyBowes.validateAddress({ minimalAddressValidation: false }), (err) => {
            assert(err instanceof HttpError);
            return true;
        });
    });

    await t.test('should validate an address and add postal service information', async () => {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const address = {
            addressLines: ['1600 Pennsylvania Avenue NW'],
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

        assert.ok(data);
        assert.strictEqual(data.carrierRoute, 'C000');
        assert.strictEqual(data.deliveryPoint, '00');
        assert.strictEqual(data.postalCode, '20500-0005');
        assert.strictEqual(data.status, 'VALIDATED_AND_NOT_CHANGED');
    });
});
