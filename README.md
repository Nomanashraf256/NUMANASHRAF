# English–Turkish Connect

Guests can join a shareable room to exchange translated text, voice notes, and files. Two online participants can use WebRTC audio with phrase-by-phrase translated captions and speech. The Python server runs the speech and translation models on CPU. The browser sends call audio directly to the other participant over WebRTC when network conditions allow. It sends separate short audio clips to your server for transcription.

## Start on one computer

Requirements are Python 3.12, eSpeak NG, and a recent browser. Start with at least 2 GB of available RAM and 1 GB of available disk. A faster CPU helps with live phrase latency. The one-time model download is about 375 MiB.

On Debian or Ubuntu, install the operating system packages first. On macOS, use `brew install python@3.12 espeak-ng` and replace `python3` below with `python3.12`. On Windows, run the Linux commands in WSL2 or use Docker Desktop.

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-venv espeak-ng
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python download_models.py
python server.py
```

Run these commands from the directory containing this README. Open [http://localhost:8080](http://localhost:8080). The localhost origin allows microphone access. Use two separate browser profiles or devices so you get distinct room identities and language settings. Use headphones to avoid audio feedback.

Docker is an alternative when a suitable Python version or eSpeak NG is unavailable. Run the same model download as a one-time step in the container.

```bash
docker build -t english-turkish-connect .
docker volume create connect-models
docker run --rm -v connect-models:/models english-turkish-connect python download_models.py
docker volume create connect-chat
docker run --rm -p 127.0.0.1:8080:8080 -v connect-models:/models:ro -v connect-chat:/data english-turkish-connect
```

Keep the host computer awake and the server running. You can reuse the models offline once installed. `MODELS` selects the model directory. `MODEL_THREADS` selects CPU threads per inference engine. `ESPEAK` can specify the full path to eSpeak NG.

## Create or join a room

1. Choose **I speak English** or **Türkçe konuşuyorum**, enter a display name, and create a room.
2. Select **Copy invite** and share the URL privately. The other person opens it, selects their language, enters a display name, then taps **Join room**. A room code is the 24 characters after `#room=`. Use the same public or LAN HTTPS origin on both devices.
3. Type and send a message. The receiver sees it in their selected language and can use **Show original** to check the source. For a voice note, tap **Record**, speak, then tap **Stop recording**. Notes stop automatically after 15 seconds. Use the media control for the original recording and the translation controls for the transcript. Tap **Play translation** for spoken playback. The sender can retry transcription or translation on a failed message.
4. Tap **Call**. The other person taps **Accept** to join or **Decline** to dismiss. Grant the microphone when prompted. Choose **Translation**, **Original audio**, or **Both**. All three modes keep captions on. If automatic phrase detection is unreliable, set **Speech capture** to **Push to talk**, tap **Start speaking**, speak one phrase, and tap **Finish phrase**.
5. Use **Mute** to pause sending microphone audio and live transcription. Use **End call** to stop the conversation and **Leave** to return to the lobby.

Automatic capture waits for a pause of roughly 650 ms before sending a phrase. Noise, weak microphones, accents, short utterances, and CPU load can affect recognition and delay. The browser queues translations in phrase order and temporarily pauses outgoing microphone audio during translated playback to reduce feedback. Take turns speaking for the most reliable translated audio. If a browser blocks playback, tap **Play translation** beside a caption. Keep mobile browsers in the foreground and allow the microphone in browser settings. The included browser suite targets Chromium. Safari and Firefox may handle autoplay, device voices, background tabs, and recording formats differently.

## HTTPS on phones and across networks

A phone cannot use the server computer’s `localhost` link. Open the server using a trusted HTTPS hostname or LAN IP covered by a trusted certificate. Both browsers must trust the issuing CA and the name must match the certificate. A browser warning bypass may still leave microphone access disabled.

For direct TLS, supply your certificate and key and listen on your LAN interface.

```bash
HOST=0.0.0.0 PORT=8443 TLS_CERT=/path/to/fullchain.pem TLS_KEY=/path/to/key.pem python server.py
```

Or serve the Python app behind a TLS reverse proxy. For example, a Caddy configuration for a domain pointed at the server is:

```caddyfile
translate.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

In that case, start the Python server with the exact external origin so the WebSocket handshake is accepted.

```bash
PUBLIC_ORIGIN=https://translate.example.com python server.py
```

Use a single server process for WebSocket delivery and call signaling. The room database survives restarts when its path is on persistent storage. Active calls end on a process restart. When inviting a person on the internet, your proxy must be reachable from both networks. The audio path also needs suitable network connectivity. Configure your own [coturn](https://github.com/coturn/coturn) STUN/TURN instance if direct calls fail across networks.

```bash
export ICE_SERVERS='[
  {"urls":["stun:turn.example.com:3478"]},
  {"urls":["turn:turn.example.com:3478?transport=udp","turns:turn.example.com:5349?transport=tcp"],
   "username":"room-user","credential":"replace-with-your-turn-password"}
]'
```

Configure coturn authentication, a TLS certificate for `turns:`, its public IP or NAT mapping, and firewall access for its listener and relay ports. Restart the app after supplying `ICE_SERVERS`. The two room participants receive the ICE credentials, so use dedicated credentials and apply relay quotas on exposed installations. Web hosting, a domain, and TURN bandwidth may cost money if you do not already have infrastructure. The app itself requires no accounts, subscriptions, or paid inference services.

## Data and models

Room links are unlisted and do not expire. Guests with a room link can read its complete retained history. Each browser profile remembers its own room identity and owner or moderator permissions. Clearing browser data loses that identity. A removed anonymous participant can create another guest identity if they still have the link. Audio from active calls and typing indicators are transient.

The server stores room data and attachments in SQLite. Configure `CHAT_DB` to point to a private persistent disk or volume. The Docker image uses `/data/chat.sqlite3`, so mount the persistent volume at `/data` before deploying on Hostless. Existing rooms from versions that stored chat only in server memory cannot be imported by this release. Keep one instance configured because WebSocket fan-out and call state run in that instance.

Schedule consistent SQLite snapshots on your backup system using unique destination paths, for example:

```bash
python chat_store.py /private-backups/learn-chat-2026-11-24.sqlite3
```

Keep verified backup copies on independent private storage. To verify a restore, launch an isolated app using the snapshot as its `CHAT_DB`, connect with a known link, and open an earlier message and attachment. Run `python -m unittest -v test_chat` for an automated restore test.

Use HTTPS when leaving localhost. The trusted server operator can access room data. A browser that supports notifications can show room alerts while the app is open and connected in a background tab. Per-room notification preferences are kept in the current browser profile.

- Speech recognition uses the multilingual [faster-whisper base](https://huggingface.co/Systran/faster-whisper-base) model in CPU INT8 mode.
- Translation uses the published English→Turkish and Turkish→English Argos 1.5 models with CTranslate2 and SentencePiece. The downloader includes each model’s credits. [Argos packages](https://data.argosopentech.com/argospm/v1/)
- Local synthesized audio uses [eSpeak NG](https://github.com/espeak-ng/espeak-ng).

## Verify

`tests/server_sessions.py` checks two independent WebSocket sessions using the real models. `tests/browser.py` drives two Chromium processes with English and Turkish WAV microphone fixtures. The included synthetic WAV fixtures contain the two example phrases. To use your own recordings, use mono 16-bit PCM WAV. For the browser check, pad the files with one second of silence at the start and two seconds at the end. Human voice recordings are useful for realistic accuracy checks.

Start the app, then run the tests in another terminal.

```bash
python tests/server_sessions.py --english tests/fixtures/en.wav --turkish tests/fixtures/tr.wav
python -m pip install playwright
python -m playwright install chromium
python tests/browser.py --chromium auto --english tests/fixtures/en.wav --turkish tests/fixtures/tr.wav
```

See [VERIFICATION.md](VERIFICATION.md) for the results from this build.

## Chat appearance, attachments and AI replies

Use **Appearance** to select a wallpaper or upload an image from your device. Your custom wallpaper (up to 3 MB) stays in the current browser. Use **Media** to select a photo or short video and then **Send** to share it with the other participant. The 12 MB per-file limit and shared server memory cap apply. Attachments are temporary and follow the room's history lifecycle. Playback depends on device codec support.

Use the **Reply** button beside a message to quote it. The message menu also offers **Draft with AI** for incoming messages if the server has an **OPENAI_API_KEY**. Add the key as a server-side environment secret. Set **OPENAI_MODEL** to override the default model. The assistant asks before sending the selected message text to OpenAI. It puts the generated reply in the composer for review and never sends it automatically. The deployment owner should apply a project budget before enabling AI on an internet-facing app.
