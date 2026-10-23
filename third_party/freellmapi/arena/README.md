# freellmapi for EGregoRA and TTI (private gateway)

Status: set-up notes only. Nothing here is deployed, and no site calls the gateway yet.

Decisions recorded so far:
- Host: the owner's own server (VPS or machine).
- Callers: both EGregoRA and TTI.
- Access: private. Only the two sites and the owner may call it.

## Conflict to resolve before going live

The upstream `docker-compose.yml` says FreeLLMAPI is single-user and must not be exposed to the internet, and it binds to 127.0.0.1 by default. The sites run on Hatchable's servers, so they can only reach the gateway over the internet. The setup below therefore needs a TLS reverse proxy and a bearer-token check in front of it. Confirm that is acceptable, or pick a different host, before going live.

## 1. Run the gateway on your server

1. Clone the upstream at the pinned commit (it is also vendored in `third_party/freellmapi/`):
   ```
   git clone https://github.com/tashfeenahmed/freellmapi
   cd freellmapi && git checkout 26484157fd15f5fb66f54d3a86f568997ea304de
   ```
2. Copy `arena/arena.env.example` to `.env` on the server. Fill in the values there only. Never commit `.env`.
3. Keep the default bind (`127.0.0.1`). Start it with `docker compose up -d`.
4. Put a reverse proxy with a valid TLS certificate in front of `127.0.0.1:3001`. Only proxy `/v1/*` and require the gateway token in an `Authorization: Bearer` header. The proxy must reject requests without it.
5. Open only 443 on the firewall. Keep 3001 closed to the internet.

I have not verified the upstream's own authentication, so the proxy token check is the access control. Test that an unauthenticated request is refused before anyone relies on it.

## 2. Connect the two sites (server-side only)

Both sites call the gateway from their server functions, never from the browser, so the token never reaches a visitor's browser.

Settings to add to each Hatchable project (EGregoRA `proj_eiuxpFfTnwwx`; TTI is `proj_U95i5y493z9x`, which is frozen and must not be deployed to from this work until the owner unfreezes it):

- `GATEWAY_BASE_URL`: the HTTPS base URL of the proxy, ending in `/v1`.
- `GATEWAY_TOKEN`: the bearer token from the proxy. Store it as a Hatchable secret, not in the code.

Calls are OpenAI-compatible, per the upstream description. Verify the exact request shape against the upstream README before writing the site code.

## 3. Keys

- Provider API keys go only into the gateway's own encrypted store or the server's secrets. They never go into this repo, into site code, or into chat.
- Upstream says "personal experimentation only", and routing across free-tier provider keys may breach each provider's terms. Check each provider's terms before relying on this for the sites.
