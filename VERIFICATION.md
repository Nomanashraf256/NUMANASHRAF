# Verification

The application ran on this workspace's Python 3.12 host using the published, checksum-verified English↔Turkish Argos models and faster-whisper base. I ran two separate HTTP/WebSocket client sessions on localhost, then repeated the suite over HTTPS/WSS with a trusted test certificate. The speech samples were generated locally for the test and are included.

| Feature | Result |
| --- | --- |
| Private rooms | Created a room, joined by invite code, received presence updates, and rejected a third participant. |
| English → Turkish typed message | “Can you hear me?” → “Beni duyabiliyor musun?” |
| Turkish → English typed message | “Evet, seni duyabiliyorum.” → “Yes, I can hear you.” |
| Voice messages, both directions | Transcribed the two WAV fixtures, produced the expected translations, and checked that the original audio bytes remained available. |
| Local speech fallback | Produced valid, non-silent WAV files in both languages. The Turkish fallback lasted 2.01 s and the English fallback lasted 1.80 s. Browser playback was not verified. |
| Failed transcription and retry | Submitted invalid audio, verified the failure state, retried, and verified the pending and failed states on both sessions. |
| Call controls and translated captions data | Verified server-side ring, decline, accept, end, signaling and leave. Submitted both speech samples as active call phrases and checked the outgoing caption text and speech fallback WAVs. |
| WebRTC transport | Two native WebRTC test peers negotiated through the running signaling server and decoded bidirectional audio frames over loopback. The peers renegotiated media after a signaling session disconnected and returned with its recovery token. |
| Two browser sessions | Chromium could not start in this environment because the workspace denied the local Unix-domain socket that Chromium needs. The two-session browser suite is included for local execution. |

Browser-only checks remain open, including layout on a physical phone, microphone permission denial and recording, localization and clipboard interaction, push-to-talk and automatic phrase detection, translated audio playback and listen modes, and automatic browser WebRTC recovery. No physical-device or internet TURN test was performed. Recognition accuracy was checked with the two included synthetic phrases. A preliminary test using a more robotic eSpeak input misrecognized an English phrase, illustrating the model's sensitivity to voice quality.

The WebRTC transport test uses aiortc peers on the same host. Add it to the server integration suite with `python -m pip install aiortc` and the `--rtc` flag. Use `--url` and `--ca` to test your own HTTPS setup.
