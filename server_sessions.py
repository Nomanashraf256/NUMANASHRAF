"""Check the real server with separate HTTP/WebSocket sessions and speech fixtures."""
import argparse
import asyncio
import base64
import io
import ssl
import uuid
import wave
from pathlib import Path
from unittest.mock import patch

from aiohttp import ClientSession, TCPConnector


async def wait(ws, kind, test=lambda item: True):
    async with asyncio.timeout(30):
        while True:
            item = await ws.receive_json()
            if item["type"] == kind and test(item):
                return item


async def audio_path(a, b, call_id):
    from aiortc import AudioStreamTrack, RTCConfiguration, RTCPeerConnection, RTCSessionDescription
    from aioice import ice

    first, second = [RTCPeerConnection(RTCConfiguration(iceServers=[])) for _ in range(2)]
    try:
        for endpoint in (first, second):
            endpoint.addTrack(AudioStreamTrack())

        async def description(sender, listener, connection, desc):
            # This smoke test stays on one host and needs only a loopback candidate.
            with patch.object(ice, "get_host_addresses", return_value=["127.0.0.1"]):
                await connection.setLocalDescription(desc)
            local = connection.localDescription
            generation = str(uuid.uuid4())
            await sender.send_json({"type": "signal", "call": call_id, "generation": generation,
                                    "signal": "description", "value": {"type": local.type, "sdp": local.sdp}})
            event = await wait(listener, "signal", lambda item: item["generation"] == generation)
            return RTCSessionDescription(**event["value"])

        await second.setRemoteDescription(await description(a, b, first, await first.createOffer()))
        await first.setRemoteDescription(await description(b, a, second, await second.createAnswer()))
        for endpoint in (first, second):
            track = endpoint.getReceivers()[0].track
            frame = await asyncio.wait_for(track.recv(), 15)
            assert frame.samples > 0
    finally:
        await asyncio.gather(first.close(), second.close())


async def run(url, english, turkish, ca=None, rtc=False):
    headers = {"Origin": url}
    def session():
        connector = TCPConnector(ssl=ssl.create_default_context(cafile=ca))
        return ClientSession(headers=headers, connector=connector)

    async with session() as first, session() as second:
        async with first.get(url) as page:
            assert page.status == 200 and "English–Turkish Connect" in await page.text()
        a = await first.ws_connect(url + "/ws")
        await a.send_json({"type": "create", "lang": "en"})
        one = await wait(a, "room")
        b = await second.ws_connect(url + "/ws")
        await b.send_json({"type": "join", "lang": "tr", "code": one["code"]})
        two = await wait(b, "room")
        await wait(a, "presence", lambda event: len(event["members"]) == 2)
        async with session() as third:
            guest = await third.ws_connect(url + "/ws")
            await guest.send_json({"type": "join", "lang": "tr", "code": one["code"]})
            assert (await wait(guest, "room"))["role"] == "guest"
            await wait(a, "presence", lambda event: event["count"] == 3)
            await guest.close()
            await wait(a, "presence", lambda event: event["count"] == 2)
        print("Shareable room, invite-code join, and three-person presence")

        async def message(sender, listener, type_, payload, status="done"):
            identifier = str(uuid.uuid4())
            await sender.send_json({"type": type_, "id": identifier, **payload})
            event = await wait(listener, "message", lambda event:
                               event["message"]["id"] == identifier and event["message"]["status"] != "pending")
            result = event["message"]
            assert result["status"] == status, result["status"]
            return result

        async def audio(client, credentials, language, phrase):
            auth = "Bearer " + credentials["code"] + "." + credentials["token"]
            async with client.post(url + "/tts", headers={"Authorization": auth},
                                   json={"lang": language, "text": phrase}) as response:
                assert response.status == 200, response.status
                wav = await response.read()
            with wave.open(io.BytesIO(wav)) as file:
                assert file.getnframes() > 5000
                assert any(file.readframes(file.getnframes()))
                return round(file.getnframes() / file.getframerate(), 2)

        samples = [
            (a, b, english, "Can you hear me?", "duy", second, two, "tr"),
            (b, a, turkish, "Evet, seni duyabiliyorum.", "hear", first, one, "en"),
        ]
        for sender, receiver, fixture, text, expected, client, credentials, target in samples:
            typed = await message(sender, receiver, "text", {"text": text})
            assert expected in typed["translated"].lower(), typed
            print(f"Typed {typed['lang']}→{target}: {typed['translated']}")
            payload = {"audio": base64.b64encode(Path(fixture).read_bytes()).decode(), "mime": "audio/wav"}
            voice = await message(sender, receiver, "voice", payload)
            assert expected in voice["translated"].lower(), voice["translated"]
            auth = "Bearer " + credentials["code"] + "." + credentials["token"]
            async with client.get(url + "/media/" + voice["key"], headers={"Authorization": auth}) as response:
                assert response.status == 200
                assert await response.read() == base64.b64decode(payload["audio"])
            duration = await audio(client, credentials, target, voice["translated"])
            print(f"Voice {voice['lang']}→{target}: {voice['original']} → {voice['translated']} | TTS {duration}s")

        broken = await message(a, b, "voice", {"audio": "eA==", "mime": "audio/wav"}, "transcription")
        await a.send_json({"type": "retry", "id": broken["id"]})
        await wait(b, "message", lambda data: data["message"]["id"] == broken["id"] and
                   data["message"]["status"] == "pending")
        await wait(b, "message", lambda data: data["message"]["id"] == broken["id"] and
                   data["message"]["status"] == "transcription")
        print("Failed transcription and retry status")
        await a.send_json({"type": "ring"})
        await wait(b, "call", lambda event: (event["call"] or {}).get("state") == "ringing")
        await b.send_json({"type": "hangup", "reason": "declined"})
        assert (await wait(a, "call", lambda event: event["call"] is None))["reason"]
        await a.send_json({"type": "ring"})
        await wait(b, "call", lambda event: (event["call"] or {}).get("state") == "ringing")
        await b.send_json({"type": "accept"})
        cid = (await wait(a, "call", lambda event: (event["call"] or {}).get("state") == "active"))["call"]["id"]
        await a.send_json({"type": "signal", "call": cid, "generation": "test", "signal": "description",
                           "value": {"type": "offer", "sdp": "test"}})
        assert (await wait(b, "signal"))["value"]["type"] == "offer"
        if rtc:
            await audio_path(a, b, cid)
            print("WebRTC negotiation and bidirectional received RTP audio frames")
        for sender, receiver, fixture, _, expected, client, credentials, target in samples:
            payload = {"audio": base64.b64encode(Path(fixture).read_bytes()).decode(), "mime": "audio/wav", "call": cid}
            phrase = await message(sender, receiver, "phrase", payload)
            assert expected in phrase["translated"].lower() and "audio" not in phrase
            duration = await audio(client, credentials, target, phrase["translated"])
            print(f"Call phrase {phrase['lang']}→{target}: {phrase['translated']} | TTS {duration}s")
        await b.close()
        await wait(a, "presence", lambda item: item["count"] == 1)
        b = await second.ws_connect(url + "/ws")
        await b.send_json({"type": "join", "code": one["code"], "token": two["token"], "lang": "tr"})
        resumed = await wait(b, "room")
        assert resumed["id"] == two["id"] and resumed["call"]["id"] == cid
        assert all(item["kind"] != "phrase" for item in resumed["messages"])
        await wait(a, "presence", lambda event: event["count"] == 2)
        if rtc:
            await audio_path(a, b, cid)
            print("WebRTC audio renegotiated after a signaling session reconnect")
        await b.send_json({"type": "hangup"})
        await wait(a, "call", lambda event: event["call"] is None)
        await b.send_json({"type": "leave"})
        await wait(a, "presence", lambda event: len(event["members"]) == 1)
        print("Decline/accept/end, signaling relay, room/call-state resume, leave")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8080")
    parser.add_argument("--english", required=True)
    parser.add_argument("--turkish", required=True)
    parser.add_argument("--ca", help="Trusted CA file for HTTPS test servers")
    parser.add_argument("--rtc", action="store_true", help="Also exercise audio transport with aiortc")
    args = parser.parse_args()
    asyncio.run(run(args.url.rstrip("/"), args.english, args.turkish, args.ca, args.rtc))
