"""Chat acceptance checks without downloading speech models."""
import asyncio
import base64
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

from aiohttp.test_utils import TestClient, TestServer

from chat_store import backup_database
from server import create_app
from server_sessions import wait


def authorization(room):
    return {"Authorization": f"Bearer {room['code']}.{room['token']}"}


class Translator:
    def translate(self, lang, text):
        return f"{lang}: {text}"

    def recognize(self, lang, audio):
        return audio.decode()


async def connect(client, kind, name, **kwargs):
    async with asyncio.timeout(5):
        ws = await client.ws_connect("/ws", origin=str(client.make_url("/")).rstrip("/"))
        await ws.send_json({"type": kind, "lang": "en", "name": name, **kwargs})
        return ws, await ws.receive_json()


async def post(ws, text, **kwargs):
    identifier = str(uuid4())
    await ws.send_json({"type": "text", "id": identifier, "text": text, **kwargs})
    result = await wait(ws, "message", lambda e: e["message"]["id"] == identifier
                        and e["message"]["status"] == "done")
    return result["message"]


class RoomsTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.db = Path(directory.name) / "chat.sqlite3"
        self.backup = self.db.with_name("restore.sqlite3")

    def client(self, db):
        app = create_app(False, str(db))
        app["models"] = Translator()
        return TestClient(TestServer(app))

    async def history(self, client, room, **query):
        response = await client.get("/history", headers=authorization(room), params=query)
        self.assertEqual(response.status, 200)
        return await response.json()

    async def test_rooms_search_catchup_media_and_restore(self):
        async with self.client(self.db) as client:
            a, room = await connect(client, "create", "Creator")
            other, other_room = await connect(client, "create", "Other creator")
            self.assertNotEqual(room["code"], other_room["code"])
            b, guest = await connect(client, "join", "Guest B", code=room["code"])
            c, late = await connect(client, "join", "Guest C", code=room["code"])
            d, second_guest = await connect(client, "join", "Guest D", code=other_room["code"])
            self.assertEqual((guest["name"], late["role"], second_guest["role"]), ("Guest B", "guest", "guest"))
            await wait(a, "presence", lambda e: e["count"] == 3)
            for ws in (b, c, d):
                await ws.close()
            first = await post(a, "First historical safety message")
            await a.send_json({"type": "text", "id": first["id"], "text": "duplicate"})
            repeated = await wait(a, "message", lambda e: e["message"]["id"] == first["id"])
            self.assertEqual(repeated["message"]["key"], first["key"])
            self.assertEqual(repeated["message"]["original"], first["original"])
            reply = await post(a, "Reply to first", reply=first["key"])
            self.assertEqual(reply["reply"]["original"], first["original"])

            attachment = b"%PDF-test"
            upload_id = str(uuid4())
            media_headers = authorization(room) | {"Content-Type": "application/pdf"}
            for _ in range(2):
                result = await client.post("/media", params={"id": upload_id, "name": "Safety.pdf"},
                                           headers=media_headers, data=attachment)
                self.assertEqual(result.status, 200)
                media = await result.json()
            forbidden = await client.get("/media/" + media["key"], headers=authorization(other_room))
            self.assertEqual(forbidden.status, 404)
            voice_id = str(uuid4())
            await a.send_json({"type": "voice", "id": voice_id, "mime": "audio/wav",
                               "audio": base64.b64encode(b"test audio").decode()})
            voice = (await wait(a, "message", lambda e: e["message"]["id"] == voice_id and
                                e["message"]["status"] == "done"))["message"]
            self.assertNotIn("audio", voice)
            for i in range(42):
                await post(a, f"Later message {i}")
            await a.send_json({"type": "reaction", "key": first["key"], "value": "👍"})
            await wait(a, "message", lambda e: e["message"].get("reactions", {}).get(room["id"]) == "👍")
            await a.send_json({"type": "pin", "key": first["key"], "value": True})
            await wait(a, "message", lambda e: e["message"].get("pinned"))
            await a.send_json({"type": "edit", "key": first["key"], "value": "Updated historical safety message"})
            await wait(a, "message", lambda e: e["message"]["key"] == first["key"] and
                       e["message"].get("edited") and e["message"]["status"] == "done")
            p, participant = await connect(client, "join", "Late guest", code=room["code"])
            self.assertEqual(len(participant["messages"]), 40)
            self.assertTrue(participant["more"])
            older = await self.history(client, participant, before=participant["messages"][0]["seq"])
            self.assertEqual(older["messages"][0]["key"], first["key"])
            search = await self.history(client, participant, q="updated historical", pins=1)
            self.assertEqual(len(search["messages"]), 1)
            self.assertEqual(search["messages"][0]["reactions"][room["id"]], "👍")
            files = await self.history(client, participant, media=1, q="Safety")
            self.assertEqual([item["key"] for item in files["messages"]], [media["key"]])
            media_seq = files["messages"][0]["seq"]
            await p.send_json({"type": "receipt", "delivered": media_seq,
                               "read": media_seq})
            await p.send_json({"type": "report", "key": first["key"], "value": "test sync"})
            await wait(p, "reported")
            counts = await client.get("/room-details", headers=authorization(room), params={"receipt": media_seq})
            self.assertEqual(await counts.json(), {"delivered": 1, "read": 1})
            await a.send_json({"type": "forward", "key": media["key"], "room": other_room["code"],
                               "token": other_room["token"], "id": str(uuid4())})
            forwarded = (await wait(other, "message", lambda e: e["message"].get("forwarded")))["message"]
            response = await client.get("/media/" + forwarded["key"], headers=authorization(other_room))
            self.assertEqual(await response.read(), attachment)
            await p.close()
            await a.send_json({"type": "reaction", "key": first["key"], "value": "❤️"})
            await wait(a, "message", lambda e: e["message"].get("reactions", {}).get(room["id"]) == "❤️")
            missed = await post(a, "Sent while disconnected", mentions=[participant["id"]])
            p, resumed = await connect(client, "join", "Ignored", code=room["code"],
                                       token=participant["token"], after=participant["messages"][-1]["seq"])
            self.assertEqual(resumed["id"], participant["id"])
            self.assertEqual([item["key"] for item in resumed["messages"]], [missed["key"]])
            changes = await client.get("/changes", headers=authorization(resumed), params={
                "after": participant["version"], "through": resumed["version"],
            })
            changes = {item["key"]: item for item in (await changes.json())["messages"]}
            self.assertEqual(changes[first["key"]]["reactions"][room["id"]], "❤️")
            self.assertEqual(changes[missed["key"]]["mentions"], [participant["id"]])
            for ws in (a, other, p):
                await ws.close()

        backup_database(self.db, self.backup)
        async with self.client(self.backup) as client:
            a, restored = await connect(client, "join", "Original creator", code=room["code"], token=room["token"])
            self.assertEqual(restored["role"], "owner")
            first_page = await self.history(client, restored, q="updated historical")
            self.assertEqual(first_page["messages"][0]["key"], first["key"])
            for key, content in ((media["key"], attachment), (voice["key"], b"test audio")):
                response = await client.get("/media/" + key, headers=authorization(restored))
                self.assertEqual(response.status, 200)
                self.assertEqual(await response.read(), content)
            await a.close()

    async def test_roles_reports_and_group(self):
        async with self.client(self.db) as client:
            a, room = await connect(client, "create", "Owner")
            guests = [await connect(client, "join", f"Guest {i}", code=room["code"]) for i in range(50)]
            await wait(a, "presence", lambda event: event["count"] == 51)
            b, guest = guests[0]
            c, other = guests[1]
            text = await post(b, "Moderation example")
            await c.send_json({"type": "report", "key": text["key"], "value": "Spam"})
            await wait(c, "reported")
            denied = await client.get("/room-details", headers=authorization(other))
            self.assertEqual((await denied.json())["reports"], [])
            details = await client.get("/room-details", headers=authorization(room))
            result = await details.json()
            self.assertEqual(len(result["participants"]), 50)
            self.assertEqual(result["reports"][0]["message"], text["key"])
            await a.send_json({"type": "moderate", "member": other["id"], "operation": "promote"})
            self.assertEqual((await wait(c, "role"))["role"], "moderator")
            await c.send_json({"type": "delete", "key": text["key"]})
            await wait(a, "message", lambda e: e["message"].get("deleted"))
            await c.send_json({"type": "resolve", "report": result["reports"][0]["id"]})
            await c.send_json({"type": "moderate", "member": guest["id"], "operation": "remove"})
            self.assertEqual((await wait(b, "error"))["error"], "removed")
            retry, rejection = await connect(client, "join", "Guest", token=guest["token"], code=room["code"])
            self.assertEqual(rejection["error"], "removed")
            await retry.close()
            for ws, _ in guests:
                await ws.close()
            await a.close()

    async def test_many_independent_active_rooms(self):
        async with self.client(self.db) as client:
            owners = [await connect(client, "create", f"Owner {i}") for i in range(24)]
            guests = [await connect(client, "join", f"Guest {i}", code=state["code"])
                      for i, (_, state) in enumerate(owners)]
            await asyncio.gather(*(post(ws, f"Room message {i}") for i, (ws, _) in enumerate(owners[:12])))
            await asyncio.gather(*(post(ws, f"Room message {i}") for i, (ws, _) in enumerate(owners[12:], 12)))
            for i, (_, state) in enumerate(guests):
                page = await self.history(client, state)
                self.assertEqual([item["original"] for item in page["messages"]], [f"Room message {i}"])
            await asyncio.gather(*(ws.close() for ws, _ in owners + guests))


if __name__ == "__main__":
    unittest.main()
