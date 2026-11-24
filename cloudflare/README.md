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

## Windows setup from start to finish

1. Install Git and a supported Node.js LTS release. Open PowerShell and run `git --version` and `node --version`.
2. Sign in to the Cloudflare account that owns the existing `numanashraf` Worker. In R2, verify that `learn-connect-chat-media` exists in that account and its public access is disabled.
3. Clone the Cloudflare branch into a fresh directory. This checkout contains the build script and Worker configuration.

   ```powershell
   git clone --branch codex/learn-cloudflare --single-branch https://github.com/Nomanashraf256/NUMANASHRAF.git learn-cloudflare-fresh
   cd learn-cloudflare-fresh
   git branch --show-current
   Test-Path cloudflare/build.mjs
   npm.cmd ci
   npm.cmd run check
   ```

   The branch command should print `codex/learn-cloudflare`. `Test-Path` should print `True`. The `.cmd` launchers work with the Windows PowerShell execution policy left as configured.

4. Authorize Wrangler in your browser, then verify the account.

   ```powershell
   npx.cmd wrangler login
   npx.cmd wrangler whoami
   ```

5. Package a dry run, then deploy to the existing Worker if the dry run succeeds. The name argument matches the Worker in the dashboard.

   ```powershell
   npx.cmd wrangler deploy --config cloudflare/wrangler.jsonc --name numanashraf --dry-run
   npm.cmd run deploy:cloudflare -- --name numanashraf
   ```

6. Open the HTTPS URL Wrangler prints. If Wrangler shows no public URL, check **Settings → Domains & Routes** for the Worker's `workers.dev` route. Use a disposable room for testing before directing real users to the Worker.
7. If you later enable automatic GitHub deployment, connect this repository in **Settings → Builds**. Set the production branch to `codex/learn-cloudflare`, root to `/`, build command to `npm run check`, and deploy command to `npx wrangler deploy --config cloudflare/wrangler.jsonc --name numanashraf`. Leave preview branch builds off during setup. A build that still reports `MODULE_NOT_FOUND` for `cloudflare/build.mjs` needs its checkout branch and commit checked before retrying.

## Acceptance checklist

| Area | Design | Test after deployment |
| --- | --- | --- |
| Links and access | The same room identifier routes to the same Durable Object. A link-enabled room accepts guests with a display name. Owners can disable new guest joins. | Create two rooms from separate browser profiles. Join both from a third profile. Disable sharing in one room and confirm a new profile cannot join. |
| History and search | SQLite stores messages, revisions, and the search index. R2 stores attachment bytes. History pages use sequence cursors. | Add more than 40 messages, including an attachment in the oldest page. Join late, search for the first message, open its attachment, and jump to the latest. Redeploy and repeat with the same link. |
| Reconnect | The browser retries pending sends with the same ID during a socket reconnect. The server checks that ID before writing a duplicate. The history and revision endpoints reconcile missed events. | Disconnect a guest, send and edit a message from another browser, then reconnect. Confirm the latest content and a single copy of each message. |
| Messaging | WebSocket events carry typing, mentions, reactions, replies, edits, pins, and moderation actions. Receipt counters summarize delivery and read state. | Exercise each feature with an owner, moderator, and guest. Verify the guest cannot use owner-only controls. |
| Files and notifications | Private R2 serves files through room access checks. Notification preferences apply per room while the app is open. | Try an image, video, document, and voice note. Verify search, preview or download, and muted notifications. |
| Mobile | The composer adapts to the visible viewport and retains draft text when controls collapse. | On iPhone Safari and Android Chrome, open a room, type a long draft with the keyboard open, use **Show controls**, then send. Repeat on desktop and check scroll position and caret. |
| Recovery | The archive utility exports room records and R2 media together. Staging restore starts with guest access disabled. | Export a disposable room and restore into a separate environment. Verify its room ID, owner token, first message, and downloaded attachment before production use. |
