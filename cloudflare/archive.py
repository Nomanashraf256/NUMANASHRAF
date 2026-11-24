"""Export or restore Cloudflare rooms and attachments using the restricted migration API."""
import argparse
import json
import os
import re
import urllib.parse
import urllib.request
from pathlib import Path

TABLES = ("settings", "members", "messages", "reports")
MEDIA_KEY = re.compile(r"[a-f0-9]{16}:[a-f0-9-]{32,36}")


def request(base, code, table, method="GET", data=None, **query):
    url = base.rstrip("/") + "/admin/room?" + urllib.parse.urlencode(dict(room=code, table=table, **query))
    headers = {"Authorization": "Bearer " + os.environ["MIGRATION_SECRET"]}
    if isinstance(data, list):
        data = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    with urllib.request.urlopen(urllib.request.Request(url, data, headers, method=method), timeout=60) as response:
        return response.read()


def media_keys(snapshot):
    for row in snapshot["messages"]:
        item = json.loads(row["data"])
        if not item.get("deleted") and item.get("kind") in {"media", "voice"}:
            key = row["key"]
            if not MEDIA_KEY.fullmatch(key):
                raise ValueError("Invalid attachment key")
            yield key


def export(base, code, destination):
    destination.mkdir(mode=0o700, parents=False)
    snapshot = {}
    for table in TABLES:
        rows = snapshot[table] = []
        after = 0
        while True:
            page = json.loads(request(base, code, table, after=after))
            rows.extend(page)
            if len(page) < 40:
                break
            after = page[-1]["position"]
    if not snapshot["settings"]:
        raise ValueError("Room not found")
    for key in media_keys(snapshot):
        (destination / key.replace(":", "-")).write_bytes(request(base, code, "media", key=key))
    (destination / "room.json").write_text(json.dumps(snapshot, ensure_ascii=False), encoding="utf-8")


def restore(base, code, source):
    snapshot = json.loads((source / "room.json").read_text(encoding="utf-8"))
    if snapshot["settings"][0]["code"] != code:
        raise ValueError("Snapshot room code must match the destination")
    for table in TABLES:
        rows = snapshot[table]
        for offset in range(0, len(rows), 40):
            request(base, code, table, "POST", rows[offset:offset + 40])
    for key in media_keys(snapshot):
        path = source / key.replace(":", "-")
        request(base, code, "media", "PUT", path.read_bytes(), key=key)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=["export", "restore"])
    parser.add_argument("base_url")
    parser.add_argument("room_code")
    parser.add_argument("directory", type=Path)
    arguments = parser.parse_args()
    operation = export if arguments.operation == "export" else restore
    operation(arguments.base_url, arguments.room_code, arguments.directory)
