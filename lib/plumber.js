import "https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js";
import { pipe } from "./pipes/pipes.js";
import { valid, strSignature } from "./validate/validate.js";

const WebRTCPlumber = async function (keys, peerOptions) {
    if (!valid("keypair")(keys)) throw new TypeError("`keys` must be in the form of a SubtleCrypto keypair");

    const id = strSignature.buf2hex(await crypto.subtle.exportKey('raw', keys.publicKey));
    const peer = new Peer(id, peerOptions);
    const peers = {};
    const messageHub = new EventTarget();

    //
    //  Receiving
    //

    const packetIntegrity = async (packet, pubkey) =>
        valid("packet")(packet)
        && await strSignature.verify(
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
                const subs = peers[peerid].subscriptions;
                subs.push(...data.sub);
                data.unsub.forEach(topic =>
                    subs.indexOf(topic) > -1
                        ? subs.splice(subs.indexOf(topic), 1)
                        : 0
                );
                break;

            case 2: if (!valid("pubPacket")(data)) break;
                messageHub.dispatchEvent(new CustomEvent("message", { detail: data }))
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
                console.log("[Plumber] connected to ", conn.peer)
                res(peers[conn.peer]);
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

    const _broadcast = async packet => {
        for (const p of Object.values(peers)) await _send(packet, p.conn);
    }

    //
    // Interactions (subscribing, unsubscribing, topics)
    //

    const topic = path => ({
        get _path() { return path },
        topic: newPath => topic([path, newPath].join(".")),
        back: n => topic(
            path.split(".")
                .slice(0, (
                    typeof n === "number"
                        ? n == 0
                            ? path.split(".").length
                            : -1 * Math.abs(n)
                        : -1
                ))
                .join(".")
        ),
        pub: data => _broadcast([2, { topic: path, body: data }]),
        sub: callback => {
            _broadcast([1, { sub: [path], unsub: [] }]);

            const wrapback = e => e.detail.topic === path && callback(e.detail.body);
            messageHub.addEventListener("message", wrapback);
            return {
                unsub: () => {
                    _broadcast([1, { sub: [], unsub: [path] }])
                    messageHub.removeEventListener("message", wrapback);
                }
            };
        }
    });

    //
    // 
    //


    //
    // Exposing
    //
    const api = { connect, peer, keys, id, peers, topic, _send, _broadcast }

    return api;
};

const plumber = { WebRTCPlumber, pipe, valid, strSignature };

window.WebRTCPlumber = WebRTCPlumber;
window.plumber = plumber;

export default plumber;