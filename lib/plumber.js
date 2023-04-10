import "https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js";
import { pipe } from "./pipes/pipes.js";
import { valid, strSignature } from "./validate/validate.js";

const WebRTCPlumber = async function (keys, peerOptions) {
    if (!valid("keypair")(keys)) throw new TypeError("`keys` must be in the form of a SubtleCrypto keypair");

    const id = strSignature.buf2hex(await crypto.subtle.exportKey('raw', keys.publicKey));
    const peer = new Peer(id, peerOptions);
    const peers = {};

    //
    //  Receiving
    //

    const packetIntegrity = async (packet, pubkey) =>
        valid("packet")(packet)
        && (console.log(packet), true) && await strSignature.verify(
            pubkey,
            packet[0],
            JSON.stringify(packet[1])
        );

    const handleMessages = async function (packet, peerid) {
        if (!await packetIntegrity(packet, peers[peerid].pubkey)) return console.warn("[Plumber] received message with invalid signature");

        const type = packet[1][0];
        const data = packet[1][1];

        switch (type) {
            case 0:
                break;

            case 1: if (!valid("subPacket")(data)) break;
                peers[peerid].subscriptions.push(...data.sub);
                data.unsub.forEach(topic =>
                    peers[peerid].subscriptions.indexOf(topic) > -1
                        ? array.splice(array.indexOf(topic), 1)
                        : 0
                );
                break;

            case 2:
                break;

            default:
                break;
        }
    };

    //
    // Connecting
    //

    const addpeer = conn => new Promise((res, rej) => {
        try {
            conn.on('open', async function () {
                peers[conn.peer] = {
                    conn,
                    subscriptions: [],
                    pubkey: await crypto.subtle.importKey(
                        'raw',
                        strSignature.hex2buf(conn.peer),
                        {
                            name: "ECDSA",
                            namedCurve: "P-384"
                        },
                        true,
                        ["verify"]
                    )
                };
                conn.on('data', data => handleMessages(data, conn.peer));
                res(peers[conn.peer])
            });
        } catch (e) {
            rej(e);
        };
    });

    peer.on('connection', addpeer);
    const connect = id => addpeer(peer.connect(id, { serialization: "json" }));

    //
    // Sending
    //

    const _send = async (packet, conn) =>
        conn.send([
            await strSignature.sign(keys.privateKey, JSON.stringify(packet)),
            packet
        ]);


    //
    // Exposing
    //
    const api = { connect, peer, keys, id, peers, _send }

    return api;
};

const plumber = { WebRTCPlumber, pipe, valid, strSignature };

window.WebRTCPlumber = WebRTCPlumber;
window.plumber = plumber;

export default plumber;