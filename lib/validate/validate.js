import schemas from "./schemas.js";

const _validate = schema => {

    const _valid = (object, schemaLayer = schema) => {
        // Check if objects are same shape
        if (Object.keys(schemaLayer).length !== Object.keys(object).length) return false;

        // Iterate over the keys in the object to validate and check if they are valid according to the schema layer
        for (const key of Object.keys(object)) switch (typeof schemaLayer[key]) {
            case 'undefined':
                return false;

            case 'object':
                if (!_valid(object[key], schemaLayer[key])) return false;
                break;

            case 'string':
                if (typeof object[key] !== schemaLayer[key]) return false;
                break;

            default:
                if (!schemaLayer[key](object[key])) return false;
                break;
        };

        // If no errors were found, the object is valid
        return true;
    };

    return _valid;
};

const valid = type => {
    const schema = schemas[type];
    return object => _validate(schema)(object);
};

const strSignature = {
    buf2hex: buffer =>
        [...new Uint8Array(buffer)]
            .map(x => x.toString(16).padStart(2, '0'))
            .join(''),
    hex2buf: hexstr =>
        new Uint8Array(
            hexstr.match(/[\da-f]{2}/gi)
                .map(h => parseInt(h, 16))
        ),

    sign: async function (privkey, str) {
        const signature = await crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-512" }
            },
            privkey,
            new TextEncoder().encode(str)
        );
        return this.buf2hex(signature);
    },
    verify: async function (pubkey, signstr, str) {
        const signature = this.hex2buf(signstr);
        return await crypto.subtle.verify(
            {
                name: "ECDSA",
                hash: { name: "SHA-512" },
            },
            pubkey,
            signature,
            new TextEncoder().encode(str)
        );
    }
}

export { valid, strSignature };