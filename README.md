# ASTRA RUSH — FINAL WORKING BUILD

This version intentionally has ZERO npm dependencies.

Requirements:
- Node.js 18+
- No `npm install` required.

Run:
`npm start`
or:
`node server.js`

Then open http://localhost:3000

Automated verification:
`npm test`

The automated test checks:
health endpoint → room creation → second player joins → synchronized two-player state → countdown → player movement.

For Handshake, deploy this entire folder to any Node.js host. The host only needs to run `npm start`. Because this build uses ordinary HTTP polling rather than a WebSocket package, it is simpler to deploy and works through standard Node hosting/proxies.

Game:
- 2 players
- 5-character private room code
- separate-device compatible when deployed
- server-authoritative movement, collision, scoring, winner
- first to 10
- rematch
- desktop keyboard + mobile touch controls
- animated cinematic background, stars, asteroids, ships and core
