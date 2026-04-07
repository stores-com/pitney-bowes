const assert = require('assert');
const crypto = require('crypto');

const cache = require('memory-cache');
const nock = require('nock');

const PitneyBowes = require('../index');

describe('PitneyBowes.createShipment', function() {
    this.timeout(5000);

    beforeEach(function() {
        cache.clear();
    });

    it('should return an error for invalid baseUrl', function(done) {
        const pitneyBowes = new PitneyBowes({
            baseUrl: 'invalid'
        });

        pitneyBowes.createShipment({}, {}, function(err, shipment) {
            assert(err);
            assert.strictEqual(err.message, 'Invalid URI "invalid/oauth/token"');
            assert.strictEqual(err.status, undefined);
            assert.strictEqual(shipment, undefined);

            done();
        });
    });

    it('should return an error for invalid baseUrl', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err, token) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'invalid'
            });

            // Update cache
            cache.put('invalid/oauth/token', token, token.expiresIn * 1000 / 2);

            pitneyBowes.createShipment({}, {}, function(err, shipment) {
                assert(err);
                assert.strictEqual(err.message, 'Invalid URI "invalid/v1/shipments"');
                assert.strictEqual(err.status, undefined);
                assert.strictEqual(shipment, undefined);

                done();
            });
        });
    });

    it('should return an error for non 200 status code', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'https://httpbin.org/status/500#'
            });

            pitneyBowes.createShipment({}, {}, function(err, shipment) {
                assert(err);
                assert.strictEqual(err.message, 'Internal Server Error');
                assert.strictEqual(err.status, 500);
                assert.strictEqual(shipment, undefined);

                done();
            });
        });
    });

    it('should return an error when no shipment is specified', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.createShipment({}, {}, function(err, shipment) {
            assert(err);
            assert.strictEqual(err.message, 'Missing required header "X-PB-TransactionId"');
            assert.strictEqual(err.status, 400);
            assert.strictEqual(shipment, undefined);

            done();
        });
    });

    it('should return a valid response', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const options = {
            integratorCarrierId: '987654321',
            shipmentGroupId: '500002',
            transactionId: crypto.randomBytes(12).toString('hex')
        };

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

        pitneyBowes.createShipment(shipment, options, function(err, shipment) {
            assert.ifError(err);
            assert(shipment.documents[0].pages[0].contents);

            done();
        });
    });
});

describe('PitneyBowes.createManifest', function() {
    this.timeout(5000);

    beforeEach(function() {
        cache.clear();
    });

    it('should return an error for invalid baseUrl', function(done) {
        const pitneyBowes = new PitneyBowes({
            baseUrl: 'invalid'
        });

        pitneyBowes.createManifest({}, {}, function(err, shipment) {
            assert(err);
            assert.strictEqual(err.message, 'Invalid URI "invalid/oauth/token"');
            assert.strictEqual(err.status, undefined);
            assert.strictEqual(shipment, undefined);

            done();
        });
    });

    it('should return an error for invalid baseUrl', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err, token) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'invalid'
            });

            // Update cache
            cache.put('invalid/oauth/token', token, token.expiresIn * 1000 / 2);

            pitneyBowes.createManifest({}, {}, function(err, shipment) {
                assert(err);
                assert.strictEqual(err.message, 'Invalid URI "invalid/v1/manifests"');
                assert.strictEqual(err.status, undefined);
                assert.strictEqual(shipment, undefined);

                done();
            });
        });
    });

    it('should return an error for non 200 status code', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'https://httpbin.org/status/500#'
            });

            pitneyBowes.createManifest({}, {}, function(err, shipment) {
                assert(err);
                assert.strictEqual(err.message, 'Internal Server Error');
                assert.strictEqual(err.status, 500);
                assert.strictEqual(shipment, undefined);

                done();
            });
        });
    });

    it('should return an error when no manifest is specified', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.createManifest({}, {}, function(err, manifest) {
            assert(err);
            assert.strictEqual(err.message, 'Missing required header "X-PB-TransactionId"');
            assert.strictEqual(err.status, 400);
            assert.strictEqual(manifest, undefined);

            done();
        });
    });

    it.skip('should return a valid response', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const options = {
            transactionId: crypto.randomBytes(12).toString('hex')
        };

        const manifest = {
            carrier: 'NEWGISTICS',
            parameters: [
                {
                    name: 'SHIPPER_ID',
                    value: '9015544760'
                },
                {
                    name: 'CLIENT_ID',
                    value: 'NGST'
                }
            ]
        };

        pitneyBowes.createManifest(manifest, options, function(err, manifest) {
            assert.ifError(err);
            assert(manifest);

            done();
        });
    });
});

describe('PitneyBowes.getOAuthToken', function() {
    this.timeout(5000);

    beforeEach(function() {
        cache.clear();
    });

    it('should return an error for invalid baseUrl', function(done) {
        const pitneyBowes = new PitneyBowes({
            baseUrl: 'invalid'
        });

        pitneyBowes.getOAuthToken(function(err, oAuthToken) {
            assert(err);
            assert.strictEqual(err.message, 'Invalid URI "invalid/oauth/token"');
            assert.strictEqual(err.status, undefined);
            assert.strictEqual(oAuthToken, undefined);

            done();
        });
    });

    it('should return an error for non 200 status code', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
            baseUrl: 'https://httpbin.org/status/500#'
        });

        pitneyBowes.getOAuthToken(function(err, oAuthToken) {
            assert(err);
            assert.strictEqual(err.message, 'Internal Server Error');
            assert.strictEqual(err.status, 500);
            assert.strictEqual(oAuthToken, undefined);

            done();
        });
    });

    it('should return a valid oAuthToken', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err, oAuthToken) {
            assert.ifError(err);

            assert(oAuthToken);
            assert(oAuthToken.access_token);
            assert(oAuthToken.clientID);
            assert(oAuthToken.expiresIn);
            assert(oAuthToken.issuedAt);
            assert(oAuthToken.org);
            assert.strictEqual(oAuthToken.tokenType, 'BearerToken');

            done();
        });
    });

    it('should return the same token on subsequent calls', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err, token1) {
            assert.ifError(err);

            pitneyBowes.getOAuthToken(function(err, token2) {
                assert.ifError(err);
                assert.deepStrictEqual(token1, token2);

                done();
            });
        });
    });
});

describe('PitneyBowes.rate', function() {
    this.timeout(5000);

    beforeEach(function() {
        cache.clear();
    });

    it('should return an error for invalid baseUrl', function(done) {
        const pitneyBowes = new PitneyBowes({
            baseUrl: 'invalid'
        });

        pitneyBowes.rate({}, {}, function(err, shipment) {
            assert(err);
            assert.strictEqual(err.message, 'Invalid URI "invalid/oauth/token"');
            assert.strictEqual(err.status, undefined);
            assert.strictEqual(shipment, undefined);

            done();
        });
    });

    it('should return an error for invalid baseUrl', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err, token) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'invalid'
            });

            // Update cache
            cache.put('invalid/oauth/token', token, token.expiresIn * 1000 / 2);

            pitneyBowes.rate({}, {}, function(err, shipment) {
                assert(err);
                assert.strictEqual(err.message, 'Invalid URI "invalid/v1/rates"');
                assert.strictEqual(err.status, undefined);
                assert.strictEqual(shipment, undefined);

                done();
            });
        });
    });

    it('should return an error for non 200 status code', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'https://httpbin.org/status/500#'
            });

            pitneyBowes.rate({}, {}, function(err, shipment) {
                assert(err);
                assert.strictEqual(err.message, 'Internal Server Error');
                assert.strictEqual(err.status, 500);
                assert.strictEqual(shipment, undefined);

                done();
            });
        });
    });

    it('should return an error when no shipment is specified', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.rate({}, {}, function(err, rate) {
            assert(err);
            assert.strictEqual(err.status, 400);
            assert.strictEqual(rate, undefined);

            done();
        });
    });

    it('should return a valid response', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        const options = {
            integratorCarrierId: '987654321',
            shipmentGroupId: '500002',
            transactionId: crypto.randomBytes(12).toString('hex')
        };

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

        pitneyBowes.rate(shipment, options, function(err, rate) {
            assert.ifError(err);
            assert(rate.rates.length > 0);

            done();
        });
    });
});

describe('PitneyBowes.tracking', function() {
    this.timeout(5000);

    beforeEach(function() {
        cache.clear();
    });

    it('should return an error for invalid baseUrl', function(done) {
        const pitneyBowes = new PitneyBowes({
            baseUrl: 'invalid'
        });

        pitneyBowes.tracking({ carrier: 'USPS', trackingNumber: '4206311892612927005269000081323326' }, function(err, data) {
            assert(err);
            assert.strictEqual(err.message, 'Invalid URI "invalid/oauth/token"');
            assert.strictEqual(err.status, undefined);
            assert.strictEqual(data, undefined);

            done();
        });
    });

    it('should return an error for invalid baseUrl', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err, token) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'invalid'
            });

            // Update cache
            cache.put('invalid/oauth/token', token, token.expiresIn * 1000 / 2);

            pitneyBowes.tracking({ carrier: 'USPS', trackingNumber: '4206311892612927005269000081323326' }, function(err, data) {
                assert(err);
                assert.strictEqual(err.message, 'Invalid URI "invalid/v1/tracking/4206311892612927005269000081323326?packageIdentifierType=TrackingNumber&carrier=USPS"');
                assert.strictEqual(err.status, undefined);
                assert.strictEqual(data, undefined);

                done();
            });
        });
    });

    it('should return an error for non 200 status code', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'https://httpbin.org/status/500#'
            });

            pitneyBowes.tracking({ carrier: 'USPS', trackingNumber: '4206311892612927005269000081323326' }, function(err, data) {
                assert(err);
                assert.strictEqual(err.message, 'Internal Server Error');
                assert.strictEqual(err.status, 500);
                assert.strictEqual(data, undefined);

                done();
            });
        });
    });

    it('should return error when no tracking number is specified', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.tracking({ carrier: 'FDR' }, function(err, data) {
            assert(err);
            assert.strictEqual(err.message, 'Bad Request');
            assert.strictEqual(err.status, 400);
            assert.strictEqual(data, undefined);

            done();
        });
    });

    it('should return package status', function(done) {
        const baseUrl = 'https://shipping-api-sandbox.pitneybowes.com/shippingservices';

        nock('https://shipping-api-sandbox.pitneybowes.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock_token',
                tokenType: 'BearerToken',
                issuedAt: Date.now().toString(),
                expiresIn: '36000',
                clientID: 'mock',
                org: 'pitneybowes'
            });

        nock(baseUrl)
            .get('/v1/tracking/9234690390809100255164')
            .query({ packageIdentifierType: 'TrackingNumber', carrier: 'USPS' })
            .reply(200, {
                packageCount: 1,
                trackingNumber: '9234690390809100255164',
                carrier: 'USPS',
                serviceName: 'USPS Ground Advantage',
                deliveryDate: '2026-03-30',
                deliveryTime: '10:45:00',
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
            });

        const pitneyBowes = new PitneyBowes();

        pitneyBowes.tracking({ carrier: 'USPS', trackingNumber: '9234690390809100255164' }, function(err, data) {
            assert.ifError(err);
            assert(data);
            assert.strictEqual(data.trackingNumber, '9234690390809100255164');
            assert.strictEqual(data.carrier, 'USPS');
            assert.strictEqual(data.status, 'Delivered');
            assert.strictEqual(data.scanDetailsList.length, 2);
            assert.strictEqual(data.currentStatus.packageStatus, 'Delivered');

            done();
        });
    });
});

describe('PitneyBowes.tlsTest', function() {
    this.timeout(5000);

    it('should return an error for invalid baseTestUrl', function(done) {
        const pitneyBowes = new PitneyBowes({
            baseTestUrl: 'invalid'
        });

        pitneyBowes.tlsTest(function(err, res) {
            assert(err);
            assert.strictEqual(err.message, 'Invalid URI "invalid/tlstest"');
            assert.strictEqual(err.status, undefined);
            assert.strictEqual(res, undefined);

            done();
        });
    });

    it('should return an error for non 200 status code', function(done) {
        const pitneyBowes = new PitneyBowes({
            baseTestUrl: 'https://httpbin.org/status/500#'
        });

        pitneyBowes.tlsTest(function(err, data) {
            assert(err);
            assert.strictEqual(err.message, 'Internal Server Error');
            assert.strictEqual(err.status, 500);
            assert.strictEqual(data, undefined);

            done();
        });
    });

    it.skip('should return TLS_Connection_Success', function(done) {
        const pitneyBowes = new PitneyBowes();

        pitneyBowes.tlsTest(function(err, res) {
            assert.ifError(err);
            assert.strictEqual(res, 'TLS_Connection_Success');

            done();
        });
    });
});

describe('PitneyBowes.validateAddress', function() {
    this.timeout(5000);

    beforeEach(function() {
        cache.clear();
    });

    it('should return an error an invalid baseUrl', function(done) {
        const pitneyBowes = new PitneyBowes({
            baseUrl: 'invalid'
        });

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
            email: 'john.d@example.com',
            residential: false
        };

        pitneyBowes.validateAddress({ address }, function(err, data) {
            assert(err);
            assert.strictEqual(err.message, 'Invalid URI "invalid/oauth/token"');
            assert.strictEqual(err.status, undefined);
            assert.strictEqual(data, undefined);

            done();
        });
    });

    it('should return an error an invalid baseUrl', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err, token) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'invalid'
            });

            // Update cache
            cache.put('invalid/oauth/token', token, token.expiresIn * 1000 / 2);

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
                email: 'john.d@example.com',
                residential: false
            };

            pitneyBowes.validateAddress({ address }, function(err, data) {
                assert(err);
                assert.strictEqual(err.message, 'Invalid URI "invalid/v1/addresses/verify?minimalAddressValidation=false"');
                assert.strictEqual(err.status, undefined);
                assert.strictEqual(data, undefined);

                done();
            });
        });
    });

    it('should return an error for non 200 status code', function(done) {
        var pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.getOAuthToken(function(err) {
            assert.ifError(err);

            pitneyBowes = new PitneyBowes({
                baseUrl: 'https://httpbin.org/status/500#'
            });

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
                email: 'john.d@example.com',
                residential: false
            };

            pitneyBowes.validateAddress({ address }, function(err, data) {
                assert(err);
                assert.strictEqual(err.message, 'Internal Server Error');
                assert.strictEqual(err.status, 500);
                assert.strictEqual(data, undefined);

                done();
            });
        });
    });

    it('should return an error when no address is specified', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

        pitneyBowes.validateAddress({ minimalAddressValidation: false }, function(err, data) {
            assert(err);
            assert.strictEqual(err.message, '');
            assert.strictEqual(err.status, 415);
            assert.strictEqual(data, undefined);

            done();
        });
    });

    it('should validate an address and add postal service information', function(done) {
        const pitneyBowes = new PitneyBowes({
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

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

        pitneyBowes.validateAddress({ address, minimalAddressValidation: false }, function(err, data) {
            assert.ifError(err);
            assert.ok(data);
            assert.strictEqual(data.carrierRoute, 'C000');
            assert.strictEqual(data.deliveryPoint, '00');
            assert.strictEqual(data.postalCode, '20500-0005');
            assert.strictEqual(data.status, 'VALIDATED_AND_NOT_CHANGED');

            done();
        });
    });
});