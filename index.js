const cache = require('memory-cache');

const HttpError = require('@stores.com/http-error');

function PitneyBowes(args) {
    const options = {
        api_key: '',
        api_secret: '',
        baseUrl: 'https://shipping-api-sandbox.pitneybowes.com/shippingservices',
        baseTestUrl: 'https://api-test.pitneybowes.com',
        ...args
    };

    this.createShipment = async (shipment, _options = {}) => {
        const token = await this.getOAuthToken();

        const headers = {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
        };

        if (_options.integratorCarrierId) {
            headers['X-PB-Integrator-CarrierId'] = _options.integratorCarrierId;
        }

        if (_options.shipmentGroupId) {
            headers['X-PB-ShipmentGroupId'] = _options.shipmentGroupId;
        }

        if (_options.transactionId) {
            headers['X-PB-TransactionId'] = _options.transactionId;
        }

        const res = await fetch(`${options.baseUrl}/v1/shipments`, {
            body: JSON.stringify(shipment),
            headers,
            method: 'POST',
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };

    this.createManifest = async (manifest, _options = {}) => {
        const token = await this.getOAuthToken();

        const headers = {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
        };

        if (_options.transactionId) {
            headers['X-PB-TransactionId'] = _options.transactionId;
        }

        const res = await fetch(`${options.baseUrl}/v1/manifests`, {
            body: JSON.stringify(manifest),
            headers,
            method: 'POST',
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };

    this.getOAuthToken = async (_options = {}) => {
        const url = `${options.baseUrl.replace('/shippingservices', '')}/oauth/token`;
        const key = `pitneybowes:oauth:${options.api_key}`;

        const oAuthToken = cache.get(key);

        if (oAuthToken) {
            return oAuthToken;
        }

        const res = await fetch(url, {
            body: new URLSearchParams({ grant_type: 'client_credentials' }),
            headers: {
                Authorization: `Basic ${Buffer.from(`${options.api_key}:${options.api_secret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        const json = await res.json();

        cache.put(key, json, json.expiresIn * 1000 / 2);

        return json;
    };

    this.rate = async (shipment, _options = {}) => {
        const token = await this.getOAuthToken();

        const res = await fetch(`${options.baseUrl}/v1/rates`, {
            body: JSON.stringify(shipment),
            headers: {
                Authorization: `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };

    this.tracking = async (args, _options = {}) => {
        const token = await this.getOAuthToken();

        const res = await fetch(`${options.baseUrl}/v1/tracking/${args.trackingNumber}?packageIdentifierType=TrackingNumber&carrier=${args.carrier}`, {
            headers: {
                Authorization: `Bearer ${token.access_token}`
            },
            method: 'GET',
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };

    this.tlsTest = async (_options = {}) => {
        const res = await fetch(`${options.baseTestUrl}/tlstest`, {
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.text();
    };

    this.validateAddress = async (args, _options = {}) => {
        const token = await this.getOAuthToken();

        const res = await fetch(`${options.baseUrl}/v1/addresses/verify?minimalAddressValidation=${args.minimalAddressValidation || false}`, {
            body: JSON.stringify(args.address),
            headers: {
                Authorization: `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };
}

module.exports = PitneyBowes;
