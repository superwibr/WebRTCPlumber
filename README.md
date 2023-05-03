# WebRTCPlumber
Adds pubsub, piping, data validation, and more to WebRTC using Peerjs.

## PubSub
pubsub, or publish/subscribe, allows peers to subscribe to "topics" and publish to them. A peer only recieves messages from a topic if they are subscribed to it.

## Pipes and data conformity
RTCplumber allows you to make "pipes", which can validate that json data follows a certain template, process it using any arbitrary function, and crosspublish to another topic. The applications for this kind of feature are somewhat limited but are very powerful with smart management of topics.

## Topics and sub-topics
RTCplumber implements a tree descendance of topics. As such, one could have the topic `channel` have subtopics `metadata` and `messages`. This can greatly help with categorization of data.

## Signed topics
Top-level topics whose name is a public key are protected by signature. Any and all data that is sent to that topic with an invalid signature from the ancestor's public key will be rejected. This allows for trust of data provenance, and is quite powerful in conjuction with pipes.

# Contributing
Please contribute! I am far from being perfect, and I probably commited many crimes against codekind.
