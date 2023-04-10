export default {
    keypair: {
        publicKey: k => k instanceof CryptoKey,
        privateKey: k => k instanceof CryptoKey
    },

    packet: ['string', ['number', 'object']],

    subPacket: {
        sub: a => a instanceof Array,
        unsub: a => a instanceof Array
    }
};