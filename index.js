const cache = require('memory-cache');

const HttpError = require('@stores.com/http-error');

/**
 * Pitney Bowes Shipping API client.
 * @param {Object} args
 * @param {string} args.api_key - Pitney Bowes API key.
 * @param {string} args.api_secret - Pitney Bowes API secret.
 * @param {string} [args.baseUrl=https://shipping-api-sandbox.pitneybowes.com/shippingservices] - Base URL for the Shipping API.
 * @see https://docs.shippingapi.pitneybowes.com
 */
function PitneyBowes(args) {
    const _options = {
        api_key: '',
        api_secret: '',
        baseUrl: 'https://shipping-api-sandbox.pitneybowes.com/shippingservices',
        ...args
    };

    /**
     * Create a shipment and purchase a shipping label.
     * @param {Object} shipment - Shipment details (addresses, parcel, rates, documents).
     * @param {Object} [options={}]
     * @param {string} [options.integratorCarrierId] - Integrator carrier ID header.
     * @param {string} [options.shipmentGroupId] - Shipment group ID header.
     * @param {string} [options.transactionId] - Transaction ID header.
     * @param {number} [options.timeout=30000] - Request timeout in milliseconds.
     * @returns {Promise<Object>} The created shipment with label data.
     * @throws {HttpError} If the API returns a non-2xx response.
     * @see https://docs.shippingapi.pitneybowes.com/api/post-shipments.html
     */
    this.createShipment = async (shipment, options = {}) => {
        const token = await this.getOAuthToken();

        const headers = {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
        };

        if (options.integratorCarrierId) {
            headers['X-PB-Integrator-CarrierId'] = options.integratorCarrierId;
        }

        if (options.shipmentGroupId) {
            headers['X-PB-ShipmentGroupId'] = options.shipmentGroupId;
        }

        if (options.transactionId) {
            headers['X-PB-TransactionId'] = options.transactionId;
        }

        const res = await fetch(`${_options.baseUrl}/v1/shipments`, {
            body: JSON.stringify(shipment),
            headers,
            method: 'POST',
            signal: AbortSignal.timeout(options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };

    /**
     * Create a manifest for carrier pickup.
     * @param {Object} manifest - Manifest details (carrier, parameters).
     * @param {Object} [options={}]
     * @param {string} [options.transactionId] - Transaction ID header.
     * @param {number} [options.timeout=30000] - Request timeout in milliseconds.
     * @returns {Promise<Object>} The created manifest.
     * @throws {HttpError} If the API returns a non-2xx response.
     * @see https://docs.shippingapi.pitneybowes.com/api/post-manifests.html
     */
    this.createManifest = async (manifest, options = {}) => {
        const token = await this.getOAuthToken();

        const headers = {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
        };

        if (options.transactionId) {
            headers['X-PB-TransactionId'] = options.transactionId;
        }

        const res = await fetch(`${_options.baseUrl}/v1/manifests`, {
            body: JSON.stringify(manifest),
            headers,
            method: 'POST',
            signal: AbortSignal.timeout(options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };

    /**
     * Get an OAuth token for API authentication. Tokens are cached for half their lifetime.
     * @param {Object} [options={}]
     * @param {number} [options.timeout=30000] - Request timeout in milliseconds.
     * @returns {Promise<Object>} The OAuth token with access_token, tokenType, expiresIn, etc.
     * @throws {HttpError} If the API returns a non-2xx response.
     * @see https://docs.shippingapi.pitneybowes.com/getting-started.html
     */
    this.getOAuthToken = async (options = {}) => {
        const url = `${options.baseUrl.replace('/shippingservices', '')}/oauth/token`;
        const key = `pitneybowes:oauth:${_options.api_key}`;

        const oAuthToken = cache.get(key);

        if (oAuthToken) {
            return oAuthToken;
        }

        const res = await fetch(url, {
            body: new URLSearchParams({ grant_type: 'client_credentials' }),
            headers: {
                Authorization: `Basic ${Buffer.from(`${_options.api_key}:${_options.api_secret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            signal: AbortSignal.timeout(options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        const json = await res.json();

        cache.put(key, json, json.expiresIn * 1000 / 2);

        return json;
    };

    /**
     * Get shipping rates for a shipment.
     * @param {Object} shipment - Shipment details (addresses, parcel, rates).
     * @param {Object} [options={}]
     * @param {number} [options.timeout=30000] - Request timeout in milliseconds.
     * @returns {Promise<Object>} Rate quotes with carrier pricing.
     * @throws {HttpError} If the API returns a non-2xx response.
     * @see https://docs.shippingapi.pitneybowes.com/api/post-rates.html
     */
    this.rate = async (shipment, options = {}) => {
        const token = await this.getOAuthToken();

        const res = await fetch(`${_options.baseUrl}/v1/rates`, {
            body: JSON.stringify(shipment),
            headers: {
                Authorization: `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            signal: AbortSignal.timeout(options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };

    /**
     * Get tracking status for a package.
     * @param {Object} args
     * @param {string} args.trackingNumber - The package tracking number.
     * @param {string} args.carrier - The carrier code (e.g. 'USPS').
     * @param {Object} [options={}]
     * @param {number} [options.timeout=30000] - Request timeout in milliseconds.
     * @returns {Promise<Object>} Tracking details including status and scan events.
     * @throws {HttpError} If the API returns a non-2xx response.
     * @see https://docs.shippingapi.pitneybowes.com/api/get-tracking-details.html
     */
    this.tracking = async (args, options = {}) => {
        const token = await this.getOAuthToken();

        const res = await fetch(`${_options.baseUrl}/v1/tracking/${args.trackingNumber}?packageIdentifierType=TrackingNumber&carrier=${args.carrier}`, {
            headers: {
                Authorization: `Bearer ${token.access_token}`
            },
            method: 'GET',
            signal: AbortSignal.timeout(options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };

    /**
     * Validate a US address and add postal service information.
     * @param {Object} args
     * @param {Object} args.address - The address to validate.
     * @param {boolean} [args.minimalAddressValidation=false] - If true, only validate minimum required fields.
     * @param {Object} [options={}]
     * @param {number} [options.timeout=30000] - Request timeout in milliseconds.
     * @returns {Promise<Object>} Validated address with postal service data.
     * @throws {HttpError} If the API returns a non-2xx response.
     * @see https://docs.shippingapi.pitneybowes.com/api/post-address-verify.html
     */
    this.validateAddress = async (args, options = {}) => {
        const token = await this.getOAuthToken();

        const res = await fetch(`${_options.baseUrl}/v1/addresses/verify?minimalAddressValidation=${args.minimalAddressValidation || false}`, {
            body: JSON.stringify(args.address),
            headers: {
                'Accept-Language': 'en-US',
                Authorization: `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            signal: AbortSignal.timeout(options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };
}

module.exports = PitneyBowes;
