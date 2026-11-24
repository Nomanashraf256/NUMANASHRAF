# Learn chat on Cloudflare

Workers serves the existing Learn interface. Each room is a SQLite-backed Durable Object with its own WebSocket connections, messages, membership, search, and revisions. R2 holds private attachments. Use room tokens only as bearer credentials, and keep the R2 bucket private.

## Develop and deploy

From the repository root, build browser assets with `node cloudflare/build.mjs`. Use Wrangler 4 with `--config cloudflare/wrangler.jsonc`. Run `wrangler dev` and verify using `python cloudflare/smoke.py` in a separate terminal. The smoke test requires aiohttp. Use `wrangler deploy --dry-run` to verify packaging. For production, sign in with `wrangler login`, create the private `learn-connect-chat-media` R2 bucket in the chosen account, and deploy with `wrangler deploy`. Review Cloudflare billing first. R2 has usage-based overages. A dedicated bucket and Worker distinguish Learn resources from other projects.

The Worker uses Workers AI for text translation and attempted voice recognition, with browser speech synthesis and an English server fallback. Confirm model availability and English–Turkish quality on the deployed account. Turkish server speech fallback and the Python app's AI reply assistant require separate integrations. Calls use WebRTC and can use ICE servers configured with the `ICE_SERVERS` Worker secret. The chat stores and delivers original content independently of AI.

## Backup and cutover

Use a private independent backup location. Enable the migration endpoint by setting a high-entropy `MIGRATION_SECRET` on the Worker and in the shell environment securely, then run:

```
python cloudflare/archive.py export HTTPS_ORIGIN ROOM_CODE PRIVATE_SNAPSHOT_DIRECTORY
python cloudflare/archive.py restore STAGING_HTTPS_ORIGIN ROOM_CODE PRIVATE_SNAPSHOT_DIRECTORY
```

Exports are paginated. Take a maintenance window or pause room writes for a consistent database and attachment snapshot. Restored rooms start with link joining disabled. Members with a retained token can rejoin. Validate messages, search, media and owner identity on staging, then enable sharing explicitly only as authorized. Existing browser room tokens are scoped to the original website origin. A domain change needs a trusted transfer of those tokens or continuity at the same custom domain. Remove the migration secret after migration and keep exports private.

The current Hostless public deployment was previously observed to hold room state in process memory. This Cloudflare archive tool reads Cloudflare rooms. It cannot export the running Hostless process or recover messages the old application already discarded. Avoid switching production traffic until recoverable source data, old-link routing, and role continuity have been verified. Production backup scheduling must cover the room inventory and independent file storage.
