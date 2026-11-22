import asyncio
import base64
import json
import os
import re
import secrets
import ssl
import struct
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from aiohttp import web

ROOT = Path(__file__).resolve().parent
MODELS = Path(os.getenv("MODELS", ROOT / "models"))
ICE = json.loads(os.getenv("ICE_SERVERS", "[]"))
ROOMS = {}
WORKERS = ThreadPoolExecutor(max_workers=2)
JOBS = set()
LANGS = {"en", "tr"}
CHAT_LIMIT = 35
AUDIO_LIMIT = 2_000_000
ROOM_TTL = 300

# Whole-phrase equivalents for common expressions whose literal meanings differ.
EXPRESSIONS = {
    "en": {
        "no worries": "Sorun değil.",
        "hang in there": "Dayan, pes etme.",
        "you got this": "Bunu başarabilirsin.",
        "my bad": "Benim hatam, kusura bakma.",
        "what's up": "Naber?",
        "break a leg": "Bol şans!",
        "long time no see": "Uzun zamandır görüşmedik.",
        "keep me posted": "Beni haberdar et.",
    },
    "tr": {
        "kolay gelsin": "Hope the work goes smoothly.",
        "geçmiş olsun": "I hope you feel better soon.",
        "eline sağlık": "Thank you for your hard work.",
        "afiyet olsun": "Enjoy your meal.",
        "kusura bakma": "Sorry about that.",
        "hayırlı olsun": "Congratulations!",
        "gözün aydın": "Congratulations on the good news!",
        "naber": "What's up?",
    },
}


class Models:
    def __init__(self):
        import ctranslate2
        import sentencepiece
        from faster_whisper import WhisperModel

        self.pairs = {}
        threads = int(os.getenv("MODEL_THREADS", "2"))
        for pair in ("en_tr", "tr_en"):
            path = next((MODELS / pair).glob("*/sentencepiece.model")).parent
            self.pairs[pair] = (
                sentencepiece.SentencePieceProcessor(model_file=str(path / "sentencepiece.model")),
                ctranslate2.Translator(str(path / "model"), device="cpu", compute_type="int8", intra_threads=threads),
            )
        self.whisper = WhisperModel(str(MODELS / "whisper"), device="cpu",
                                    compute_type="int8", cpu_threads=threads, local_files_only=True)

    def translate(self, source, phrase):
        # Preserve emoji-only messages and isolate common emoji sequences from the model.
        emoji_pattern = r"([\U0001F1E6-\U0001FAFF\u2600-\u27BF][\U0001F1E6-\U0001FAFF\u2600-\u27BF\ufe0f\u200d]*)"
        segments = re.split(emoji_pattern, phrase)
        if len(segments) == 1:
            return self.translate_text(source, phrase)
        translated = []
        for index, part in enumerate(segments):
            trimmed = part.strip()
            if index % 2 or not any(char.isalpha() for char in trimmed):
                translated.append(part)
            else:
                translated.append(part.replace(trimmed, self.translate_text(source, trimmed), 1))
        return "".join(translated)

    def translate_text(self, source, phrase):
        key = " ".join(phrase.replace("’", "'").casefold().strip(" .!?").split())
        if key in EXPRESSIONS[source]:
            return EXPRESSIONS[source][key]
        target = "tr" if source == "en" else "en"
        tokenizer, model = self.pairs[f"{source}_{target}"]
        output = model.translate_batch([tokenizer.encode(phrase, out_type=str)], beam_size=4)
        result = tokenizer.decode(output[0].hypotheses[0]).strip()
        if not result:
            raise ValueError("translation")
        return result

    def recognize(self, source, raw):
        from io import BytesIO

        import av
        import numpy as np

        resampler = av.AudioResampler(format="s16", layout="mono", rate=16000)
        frames = []
        count = 0
        with av.open(BytesIO(raw), mode="r") as media:
            if not media.streams.audio:
                raise ValueError("No audio stream")
            for decoded in media.decode(audio=0):
                for frame in resampler.resample(decoded):
                    if count >= 16 * 16000:
                        break
                    samples = frame.to_ndarray().ravel()[:16 * 16000 - count]
                    count += samples.size
                    frames.append(samples)
                if count >= 16 * 16000:
                    break
        if not frames:
            raise ValueError("No audio frames")
        pcm = np.concatenate(frames).astype(np.float32) / 32768
        segments, _ = self.whisper.transcribe(pcm, language=source, beam_size=2, temperature=0,
                                              condition_on_previous_text=False, vad_filter=True)
        result = " ".join(segment.text.strip() for segment in segments).strip()
        if not result:
            raise ValueError("transcription")
        return result


def synthesize(language, text):
    wav = bytearray(subprocess.run(
        [os.getenv("ESPEAK", "espeak-ng"), "--stdout", "-v", language, "-s", "155", "--stdin"],
        input=text.encode(), capture_output=True, check=True, timeout=10,
    ).stdout)
    # eSpeak streams with placeholder lengths. Browsers need the final lengths.
    if len(wav) < 44 or wav[36:40] != b"data":
        raise ValueError("Invalid eSpeak WAV")
    struct.pack_into("<I", wav, 4, len(wav) - 8)
    struct.pack_into("<I", wav, 40, len(wav) - 44)
    return bytes(wav)


async def send(ws, payload):
    if ws and not ws.closed:
        try:
            await ws.send_json(payload)
        except (ConnectionError, RuntimeError):
            pass


async def cast(room, payload, skip=None):
    await asyncio.gather(*(send(member["ws"], payload) for token, member in room["members"].items()
                           if token != skip))


def clean_message(message):
    internal = {"busy"}
    if message["kind"] == "phrase":
        internal.update({"audio", "mime"})
    return {key: value for key, value in message.items() if key not in internal}


async def presence(room):
    await cast(room, {"type": "presence", "members": [
        {"id": member["id"], "lang": member["lang"], "online": bool(member["ws"] and not member["ws"].closed)}
        for member in room["members"].values()
    ]})


async def process(app, room, message):
    loop = asyncio.get_running_loop()
    stage = "translation"
    try:
        models = app["models"]
        if not message["original"]:
            stage = "transcription"
            raw = base64.b64decode(message["audio"], validate=True)
            message["original"] = await loop.run_in_executor(WORKERS, models.recognize, message["lang"], raw)
        stage = "translation"
        message["translated"] = await loop.run_in_executor(
            WORKERS, models.translate, message["lang"], message["original"])
        message["status"] = "done"
    except Exception:
        message["status"] = stage
    finally:
        message["busy"] = False
    if message["kind"] != "phrase" or message["call"] == (room["call"] or {}).get("id"):
        if message["kind"] == "phrase" and message["status"] == "done":
            message.pop("audio", None)
        await cast(room, {"type": "message", "message": clean_message(message)})


async def preview(app, ws, source, phrase, ref):
    try:
        result = await asyncio.get_running_loop().run_in_executor(
            WORKERS, app["models"].translate, source, phrase)
    except Exception:
        await send(ws, {"type": "preview", "ref": ref, "status": "translation"})
    else:
        await send(ws, {"type": "preview", "ref": ref, "status": "done", "text": result})


async def socket(request):
    origin = request.headers.get("Origin")
    if not origin or origin not in {f"{request.scheme}://{request.host}", os.getenv("PUBLIC_ORIGIN")}:
        raise web.HTTPForbidden()
    ws = web.WebSocketResponse(heartbeat=8, max_msg_size=3_000_000)
    await ws.prepare(request)
    room = token = member = None
    try:
        start = await asyncio.wait_for(ws.receive_json(), 8)
        if not isinstance(start, dict) or start.get("type") not in {"create", "join"} or start.get("lang") not in LANGS:
            return ws
        code = secrets.token_urlsafe(18) if start["type"] == "create" else start.get("code", "")
        if not isinstance(code, str):
            return ws
        if start["type"] == "create":
            if len(ROOMS) >= 100:
                await send(ws, {"type": "error", "error": "busy"})
                return ws
            ROOMS[code] = {"members": {}, "messages": {}, "call": None, "touched": time.monotonic()}
        room = ROOMS.get(code)
        if room is None:
            await send(ws, {"type": "error", "error": "missing"})
            return ws
        token = start.get("token")
        if not isinstance(token, str) or token not in room["members"]:
            if len(room["members"]) == 2:
                await send(ws, {"type": "error", "error": "full"})
                return ws
            token = secrets.token_urlsafe(24)
            room["members"][token] = {"id": secrets.token_hex(8), "lang": start["lang"], "ws": None}
        member = room["members"][token]
        old = member["ws"]
        member["ws"] = ws
        if old:
            await old.close()
        await send(ws, {"type": "room", "code": code, "token": token, "id": member["id"],
                        "lang": member["lang"], "ice": ICE, "call": room["call"],
                        "messages": [clean_message(item) for item in room["messages"].values()
                                     if item["kind"] != "phrase"]})
        await presence(room)
        async for packet in ws:
            if packet.type != web.WSMsgType.TEXT or member["ws"] is not ws:
                continue
            try:
                data = json.loads(packet.data)
            except ValueError:
                continue
            if not isinstance(data, dict):
                continue
            kind = data.get("type")
            call = room["call"]
            if kind == "language" and data.get("lang") in LANGS:
                member["lang"] = data["lang"]
                await presence(room)
            if kind == "typing":
                await cast(room, {"type": "typing", "active": data.get("active") is True}, token)
            if kind == "preview":
                phrase = data.get("text")
                source = member["lang"]
                ref = data.get("ref")
                now = time.monotonic()
                if (isinstance(phrase, str) and 0 < len(phrase.strip()) <= 1500
                        and isinstance(ref, int) and now - member.get("preview_at", -10) >= .6
                        and len(JOBS) == 0 and not call):
                    member["preview_at"] = now
                    task = asyncio.create_task(preview(request.app, ws, source, phrase.strip(), ref))
                    JOBS.add(task)
                    task.add_done_callback(JOBS.discard)
                else:
                    await send(ws, {"type": "preview", "ref": ref, "status": "later"})
            if kind == "leave":
                del room["members"][token]
                room["call"] = None
                await cast(room, {"type": "call", "call": None})
                await presence(room)
                break
            if kind == "ring" and not call and len(room["members"]) == 2 and all(
                    m["ws"] and not m["ws"].closed for m in room["members"].values()):
                room["call"] = {"id": secrets.token_hex(12), "caller": member["id"], "state": "ringing"}
                await cast(room, {"type": "call", "call": room["call"]})
            if kind == "accept" and call and call["state"] == "ringing" and call["caller"] != member["id"]:
                call["state"] = "active"
                await cast(room, {"type": "call", "call": call})
            if kind == "hangup" and call:
                room["call"] = None
                for key in [key for key, item in room["messages"].items() if item["kind"] == "phrase"]:
                    del room["messages"][key]
                await cast(room, {"type": "call", "call": None, "reason": data.get("reason") == "declined"})
            if kind == "signal" and call and call["state"] == "active" and call["id"] == data.get("call"):
                await cast(room, data, token)
            if kind in ("text", "voice", "phrase", "retry"):
                await handle_message(request.app, room, member, ws, kind, data)
    except (asyncio.TimeoutError, ValueError, TypeError, ConnectionError):
        pass
    finally:
        if member and member["ws"] is ws:
            member["ws"] = None
            room["touched"] = time.monotonic()
            await presence(room)
        if room and not room["members"]:
            ROOMS.pop(code, None)
    return ws


async def handle_message(app, room, member, ws, kind, data):
    if len(JOBS) >= 16:
        await send(ws, {"type": "error", "error": "busy"})
        return
    identifier = data.get("id", "")
    if not isinstance(identifier, str) or not re.fullmatch(r"[a-f0-9-]{36}", identifier):
        return
    key = f'{member["id"]}:{identifier}'
    message = room["messages"].get(key)
    if kind == "retry":
        if not message or message["busy"] or message["status"] == "done":
            return
    else:
        if message:
            await send(ws, {"type": "message", "message": clean_message(message)})
            return
        call = room["call"]
        if kind == "phrase" and (not call or call["state"] != "active" or data.get("call") != call["id"]):
            return
        original, audio, mime = data.get("text", ""), data.get("audio", ""), data.get("mime", "")
        if kind == "text":
            if not isinstance(original, str) or not 0 < len(original.strip()) <= 1500:
                return
            audio = mime = ""
        elif (not isinstance(audio, str) or not 0 < len(audio) < AUDIO_LIMIT or
              len(audio) % 4 or not re.fullmatch(r"[A-Za-z0-9+/]+={0,2}", audio) or
              not isinstance(mime, str) or not re.fullmatch(r"audio/(webm|ogg|mp4|wav)(;[a-zA-Z0-9=., -]+)?", mime)):
            return
        else:
            original = ""
        if len(room["messages"]) >= CHAT_LIMIT:
            oldest = next((key for key, item in room["messages"].items() if not item["busy"]), None)
            if oldest is None:
                await send(ws, {"type": "error", "error": "busy"})
                return
            del room["messages"][oldest]
            await cast(room, {"type": "remove", "key": oldest})
        message = {"key": key, "id": identifier, "sender": member["id"], "lang": member["lang"],
                   "kind": kind, "original": original.strip(), "audio": audio, "mime": mime,
                   "call": call["id"] if kind == "phrase" else None, "translated": "",
                   "time": int(time.time() * 1000)}
        room["messages"][key] = message
    message.update(status="pending", busy=True)
    await cast(room, {"type": "message", "message": clean_message(message)})
    task = asyncio.create_task(process(app, room, message))
    JOBS.add(task)
    task.add_done_callback(JOBS.discard)


async def tts(request):
    parts = request.headers.get("Authorization", "").removeprefix("Bearer ").split(".", 1)
    if len(parts) != 2 or parts[1] not in ROOMS.get(parts[0], {}).get("members", {}):
        raise web.HTTPForbidden()
    data = await request.json()
    if not isinstance(data, dict):
        raise web.HTTPBadRequest()
    language, phrase = data.get("lang"), data.get("text")
    if not isinstance(language, str) or language not in LANGS or not isinstance(phrase, str) or not 0 < len(phrase) <= 4000:
        raise web.HTTPBadRequest()
    try:
        wav = await asyncio.to_thread(synthesize, language, phrase)
    except (OSError, ValueError, subprocess.SubprocessError):
        raise web.HTTPServiceUnavailable()
    return web.Response(body=wav, content_type="audio/wav", headers={"Cache-Control": "no-store"})


async def reap():
    while True:
        await asyncio.sleep(15)
        for code, room in list(ROOMS.items()):
            if not any(member["ws"] for member in room["members"].values()):
                if time.monotonic() - room["touched"] > ROOM_TTL:
                    ROOMS.pop(code, None)


async def lifecycle(app):
    app["models"] = await asyncio.to_thread(Models)
    for lang in LANGS:
        await asyncio.to_thread(synthesize, lang, "Test")
    reaper = asyncio.create_task(reap())
    yield
    reaper.cancel()
    await asyncio.gather(reaper, return_exceptions=True)


@web.middleware
async def headers(request, handler):
    response = await handler(request)
    if not response.prepared:
        response.headers.update({
            "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff",
            "Permissions-Policy": "microphone=(self)", "Cache-Control": "no-store",
            "Content-Security-Policy": "default-src 'self'; media-src 'self' blob: data:; frame-ancestors 'none'",
        })
    return response


def main():
    app = web.Application(middlewares=[headers], client_max_size=32_000)
    app.cleanup_ctx.append(lifecycle)
    app.router.add_get("/", lambda _: web.FileResponse(ROOT / "web/index.html"))
    app.router.add_get("/ws", socket)
    app.router.add_post("/tts", tts)
    app.router.add_static("/assets", ROOT / "web")
    tls = None
    if os.getenv("TLS_CERT"):
        tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        tls.load_cert_chain(os.environ["TLS_CERT"], os.environ["TLS_KEY"])
    web.run_app(app, host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8080")), ssl_context=tls)


if __name__ == "__main__":
    main()
