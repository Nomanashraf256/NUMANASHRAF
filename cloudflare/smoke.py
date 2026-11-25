"""Run against wrangler dev. Run only on a disposable environment."""
import asyncio
import os
import tempfile
from pathlib import Path
from uuid import uuid4

from aiohttp import ClientSession

from archive import export, restore

BASE = os.getenv("LEARN_TEST_URL", "http://localhost:8787")


async def event(socket, wanted, predicate=lambda value: True):
    async with asyncio.timeout(10):
        async for packet in socket:
            value = packet.json()
            if value["type"] == wanted and predicate(value):
                return value
    raise AssertionError(f"Missing {wanted}")


async def main():
    async with ClientSession(headers={"Origin": BASE}) as client:
        async def join(name, code=None):
            socket = await client.ws_connect(BASE + ("/ws?room=" + code if code else "/ws?create=1"))
            await socket.send_json(dict(type="join" if code else "create", name=name, lang="en"))
            return socket, await event(socket, "room")

        def auth(state):
            return {"Authorization": f"Bearer {state['code']}.{state['token']}"}

        a, owner = await join("Owner")
        code = owner["code"]
        identifier = str(uuid4())
        payload = dict(type="text", id=identifier, text="First durable message")
        await a.send_json(payload)
        initial = await event(a, "message")
        await a.send_json(payload)
        assert (await event(a, "message"))["message"]["key"] == initial["message"]["key"]
        media_id = str(uuid4())
        async with client.post(BASE + "/media", params={"id": media_id, "name": "sample.txt"},
                               headers=auth(owner) | {"Content-Type": "text/plain"}, data=b"sample") as response:
            assert response.status == 200, await response.text()
            media = (await response.json())["key"]
        sockets = [await join(f"Guest {i}", code) for i in range(50)]
        await event(a, "presence", lambda value: value["count"] == 51)
        guest, state = sockets[0]
        assert state["messages"][0]["original"] == payload["text"]
        async with client.get(BASE + "/media/" + media, headers=auth(state)) as response:
            assert await response.read() == b"sample"
        async with client.get(BASE + "/history?q=durable", headers=auth(state)) as response:
            assert len((await response.json())["messages"]) == 1
        other_rooms = [await join(f"Other owner {i}") for i in range(24)]
        assert len({room["code"] for _, room in other_rooms} | {code}) == 25
        await a.send_json({"type": "sharing", "enabled": False})
        await a.send_json({"type": "pin", "key": initial["message"]["key"], "value": True})
        await event(a, "message", lambda value: value["message"].get("pinned"))
        denied = await client.ws_connect(BASE + "/ws?room=" + code)
        await denied.send_json(dict(type="join", name="Blocked", lang="en"))
        assert (await event(denied, "error"))["error"] == "missing"
        staging = os.getenv("LEARN_RESTORE_URL")
        if staging:
            with tempfile.TemporaryDirectory() as temporary:
                path = Path(temporary) / "room"
                await asyncio.to_thread(export, BASE, code, path)
                await asyncio.to_thread(restore, staging, code, path)
                recovered = await client.ws_connect(staging + "/ws?room=" + code, origin=staging)
                await recovered.send_json(dict(type="join", token=owner["token"], lang="en"))
                prior = await event(recovered, "room")
                assert prior["code"] == code and prior["role"] == "owner" and not prior["shared"]
                assert prior["messages"][0]["original"] == payload["text"]
                async with client.get(staging + "/media/" + media, headers=auth(prior)) as response:
                    assert await response.read() == b"sample"
                await recovered.close()
                print("Independent Cloudflare restore passed with same room code, owner identity, and attachment")
        await asyncio.gather(*(socket.close() for socket, _ in sockets + other_rooms), a.close(), denied.close())
        print("Cloudflare smoke passed: 51 in one room, 25 rooms, search, R2, deduplication, and access control")


asyncio.run(main())
