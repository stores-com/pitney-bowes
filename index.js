const cache = require('memory-cache');
const createError = require('http-errors');
const request = require('request');

function PitneyBowes(args) {
    const options = Object.assign({
        api_key: '',
        api_secret: '',
        baseUrl: 'https://shipping-api-sandbox.pitneybowes.com/shippingservices',
        baseTestUrl: 'https://api-test.pitneybowes.com'
    }, args);

    this.createShipment = function(shipment, _options, callback) {
        this.getOAuthToken(function(err, oAuthToken) {
            if (err) {
                return callback(err);
            }

            const req = {
                auth: {
                    bearer: oAuthToken.access_token
                },
                headers: {},
                json: shipment,
                method: 'POST',
                url: `${options.baseUrl}/v1/shipments`
            };

            if (_options.integratorCarrierId) {
                req.headers['X-PB-Integrator-CarrierId'] = _options.integratorCarrierId;
            }

            if (_options.shipmentGroupId) {
                req.headers['X-PB-ShipmentGroupId'] = _options.shipmentGroupId;
            }

            if (_options.transactionId) {
                req.headers['X-PB-TransactionId'] = _options.transactionId;
            }

            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                if (res.statusCode !== 201) {
                    return callback(createError(res.statusCode, body && body.length && body[0].message ? body[0] : body));
                }

                callback(null, body);
            });
        });
    };

    this.createManifest = function(manifest, _options, callback) {
        this.getOAuthToken(function(err, oAuthToken) {
            if (err) {
                return callback(err);
            }

            const req = {
                auth: {
                    bearer: oAuthToken.access_token
                },
                headers: {},
                json: manifest,
                method: 'POST',
                url: `${options.baseUrl}/v1/manifests`
            };

            if (_options.transactionId) {
                req.headers['X-PB-TransactionId'] = _options.transactionId;
            }

            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                if (res.statusCode !== 201) {
                    return callback(createError(res.statusCode, body && body.length && body[0].message ? body[0] : body));
                }

                callback(null, body);
            });
        });
    };

    this.getOAuthToken = function(callback) {
        const url = `${options.baseUrl.replace('/shippingservices', '')}/oauth/token`;

        // Try to get the token from memory cache
        const oAuthToken = cache.get(url);

        if (oAuthToken) {
            return callback(null, oAuthToken);
        }

        const req = {
            form: {
                grant_type: 'client_credentials'
            },
            headers: {
                Authorization: `Basic ${Buffer.from(`${options.api_key}:${options.api_secret}`).toString('base64')}`
            },
            json: true,
            method: 'POST',
            url
        };

        request(req, function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (res.statusCode !== 200) {
                return callback(createError(res.statusCode, body));
            }

            // Put the token in memory cache
            cache.put(url, body, body.expiresIn * 1000 / 2);

            callback(null, body);
        });
    };

    this.rate = function(shipment, _options, callback) {
        this.getOAuthToken(function(err, oAuthToken) {
            if (err) {
                return callback(err);
            }

            const req = {
                auth: {
                    bearer: oAuthToken.access_token
                },
                headers: {},
                json: shipment,
                method: 'POST',
                url: `${options.baseUrl}/v1/rates`
            };

            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                if (res.statusCode !== 200) {
                    return callback(createError(res.statusCode, body && body.length && body[0].message ? body[0] : body));
                }

                callback(null, body);
            });
        });
    };

    this.tracking = function(args, callback) {
        this.getOAuthToken(function(err, oAuthToken) {
            if (err) {
                return callback(err);
            }

            const req = {
                auth: {
                    bearer: oAuthToken.access_token
                },
                json: true,
                method: 'GET',
                url: `${options.baseUrl}/v1/tracking/${args.trackingNumber}?packageIdentifierType=TrackingNumber&carrier=${args.carrier}`
            };

            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                if (res.statusCode !== 200) {
                    return callback(createError(res.statusCode, body));
                }

                callback(null, body);
            });
        });
    };

    this.tlsTest = function(callback) {
        const req = {
            method: 'GET',
            url: `${options.baseTestUrl}/tlstest`
        };

        request(req, function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (res.statusCode !== 200) {
                return callback(createError(res.statusCode));
            }

            callback(null, body);
        });
    };

    this.validateAddress = function(args, callback) {
        this.getOAuthToken(function(err, oAuthToken) {
            if (err) {
                return callback(err);
            }

            const req = {
                auth: {
                    bearer: oAuthToken.access_token
                },
                json: args.address,
                method: 'POST',
                url: `${options.baseUrl}/v1/addresses/verify?minimalAddressValidation=${args.minimalAddressValidation || false}`
            };

            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                if (res.statusCode !== 200) {
                    return callback(createError(res.statusCode, body));
                }

                callback(null, body);
            });
        });
    };
}

module.exports = PitneyBowes;