"""Durable room data. Configure CHAT_DB on a persistent Hostless volume."""
import hashlib
import json
import os
import re
import sqlite3
from contextlib import closing
from pathlib import Path


def token_digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


class ChatStore:
    def __init__(self, path):
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.row_factory = sqlite3.Row
        self.db.executescript("""
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;
            CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY);
            CREATE TABLE IF NOT EXISTS members (
                room TEXT REFERENCES rooms(code), token TEXT, id TEXT,
                name TEXT, lang TEXT, role TEXT, removed INTEGER DEFAULT 0,
                PRIMARY KEY (room, token), UNIQUE (room, id)
            );
            CREATE TABLE IF NOT EXISTS messages (
                seq INTEGER PRIMARY KEY, room TEXT REFERENCES rooms(code),
                key TEXT, data TEXT, audio TEXT, media BLOB,
                UNIQUE(room, key)
            );
            CREATE INDEX IF NOT EXISTS messages_room_seq ON messages(room, seq);
            CREATE TABLE IF NOT EXISTS receipts (
                room TEXT, member TEXT, delivered INTEGER DEFAULT 0,
                read INTEGER DEFAULT 0, PRIMARY KEY (room, member)
            );
            CREATE TABLE IF NOT EXISTS revisions (
                room TEXT PRIMARY KEY REFERENCES rooms(code), version INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS message_versions (
                room TEXT, seq INTEGER, version INTEGER,
                PRIMARY KEY(room, seq), UNIQUE(room, version)
            );
            CREATE VIRTUAL TABLE IF NOT EXISTS message_search USING fts5(
                original, translated, correction, tokenize='unicode61'
            );
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY, room TEXT, reporter TEXT,
                message TEXT, reason TEXT, resolved INTEGER DEFAULT 0
            );
        """)

    def create_room(self, code):
        with self.db:
            self.db.execute("INSERT INTO rooms VALUES (?)", (code,))

    def exists(self, code):
        return self.db.execute("SELECT 1 FROM rooms WHERE code=?", (code,)).fetchone() is not None

    def member(self, code, token):
        row = self.db.execute(
            "SELECT id, name, lang, role, removed FROM members WHERE room=? AND token=?",
            (code, token_digest(token)),
        ).fetchone()
        return dict(row) if row else None

    def add_member(self, code, token, member):
        with self.db:
            self.db.execute(
                "INSERT INTO members (room, token, id, name, lang, role) VALUES (?, ?, ?, ?, ?, ?)",
                (code, token_digest(token), member["id"], member["name"], member["lang"], member["role"]),
            )

    def change_member(self, code, member_id, *, language=None, role=None, removed=None):
        with self.db:
            if role is not None or removed is not None:
                self.db.execute(
                    """UPDATE members SET role=coalesce(?,role), removed=coalesce(?,removed)
                       WHERE room=? AND id=? AND role!='owner'""",
                    (role, removed, code, member_id),
                )
            if language:
                self.db.execute("UPDATE members SET lang=? WHERE room=? AND id=?", (language, code, member_id))

    def participant(self, code, member_id):
        return self.db.execute("SELECT role FROM members WHERE room=? AND id=?", (code, member_id)).fetchone()

    def participants(self, code, after):
        return [dict(row) for row in self.db.execute(
            "SELECT id,name,role,removed FROM members WHERE room=? AND id>? ORDER BY id LIMIT 50",
            (code, after),
        )]

    def save(self, code, message, remove_binary=False):
        data = {k: v for k, v in message.items() if k not in {"busy", "seq", "audio", "media_bytes"}}
        with self.db:
            row = self.db.execute(
                """INSERT INTO messages(room,key,data,audio,media) VALUES (?,?,?,?,?)
                   ON CONFLICT(room,key) DO UPDATE SET data=excluded.data,
                   audio=CASE WHEN ? THEN NULL ELSE coalesce(excluded.audio,audio) END,
                   media=CASE WHEN ? THEN NULL ELSE coalesce(excluded.media,media) END
                   RETURNING seq""",
                (code, message["key"], json.dumps(data, ensure_ascii=False),
                 message.get("audio"), message.get("media_bytes"), remove_binary, remove_binary),
            ).fetchone()
            seq = row["seq"]
            version = self.db.execute(
                """INSERT INTO revisions VALUES (?,1) ON CONFLICT(room)
                   DO UPDATE SET version=version+1 RETURNING version""", (code,)
            ).fetchone()[0]
            self.db.execute("INSERT OR REPLACE INTO message_versions VALUES (?,?,?)", (code, seq, version))
            self.db.execute("DELETE FROM message_search WHERE rowid=?", (seq,))
            if not message.get("deleted"):
                self.db.execute(
                    "INSERT INTO message_search(rowid,original,translated,correction) VALUES (?,?,?,?)",
                    (seq, *(message.get(field, "") for field in ("original", "translated", "correction"))),
                )
        message["seq"] = seq

    def version(self, code):
        entry = self.db.execute("SELECT version FROM revisions WHERE room=?", (code,)).fetchone()
        return entry[0] if entry else 0

    def changes(self, code, after, through):
        rows = self.db.execute(
            """SELECT m.seq,m.data,v.version FROM message_versions v JOIN messages m ON m.seq=v.seq
               WHERE v.room=? AND v.version>? AND v.version<=? ORDER BY v.version LIMIT 41""",
            (code, after, through),
        ).fetchall()
        page = rows[:40]
        return [self.decode(row) for row in page], page[-1]["version"] if page else through, len(rows) > 40

    def latest(self, code):
        return self.db.execute("SELECT coalesce(max(seq),0) FROM messages WHERE room=?", (code,)).fetchone()[0]

    @staticmethod
    def decode(row):
        if row is None:
            return None
        message = json.loads(row["data"])
        message["seq"] = row["seq"]
        return message

    def message(self, code, key, include_audio=False):
        columns = "seq,data,audio" if include_audio else "seq,data"
        row = self.db.execute(f"SELECT {columns} FROM messages WHERE room=? AND key=?", (code, key)).fetchone()
        message = self.decode(row)
        if message and include_audio:
            message["audio"] = row["audio"]
        return message

    def delete(self, code, message):
        message.update(original="", translated="", reply=None, reactions={}, pinned=False, deleted=True)
        self.save(code, message, remove_binary=True)

    def binary(self, code, key, audio=False):
        column = "audio" if audio else "media"
        row = self.db.execute(f"SELECT {column} FROM messages WHERE room=? AND key=?", (code, key)).fetchone()
        return row[0] if row else None

    def history(self, code, before, after, query, media, pins=False):
        clauses = ["room=?", "seq>?", "(?=0 OR seq<?)"]
        args = [code, after, before, before]
        terms = re.findall(r"[^\W_]+", query, flags=re.UNICODE)
        if terms:
            clauses.append("seq IN (SELECT rowid FROM message_search WHERE message_search MATCH ?)")
            args.append(" AND ".join(f'"{term}"*' for term in terms))
        elif query:
            clauses.append("instr(data->>'original', ?) > 0")
            args.append(query)
        if media:
            clauses.append("data->>'kind' IN ('media','voice') AND data->>'deleted' IS NULL")
        if pins:
            clauses.append("data->>'pinned'=1")
        order = "ASC" if after else "DESC"
        rows = self.db.execute(
            f"SELECT seq,data FROM messages WHERE {' AND '.join(clauses)} ORDER BY seq {order} LIMIT 41", args
        ).fetchall()
        page = [self.decode(row) for row in rows[:40]]
        return (page if after else list(reversed(page))), len(rows) > 40

    def receipt(self, room, member, delivered, read):
        with self.db:
            self.db.execute(
                """INSERT INTO receipts VALUES (?,?,?,?) ON CONFLICT(room,member)
                   DO UPDATE SET delivered=max(delivered,excluded.delivered), read=max(read,excluded.read)""",
                (room, member, delivered, read),
            )

    def receipt_state(self, room, member, seq):
        return dict(self.db.execute(
            """SELECT count(*) FILTER (WHERE delivered>=?) AS delivered,
                      count(*) FILTER (WHERE read>=?) AS read
               FROM receipts WHERE room=? AND member!=?""",
            (seq, seq, room, member),
        ).fetchone())

    def report(self, room, member, key, reason):
        with self.db:
            self.db.execute("INSERT INTO reports(room,reporter,message,reason) VALUES (?,?,?,?)",
                            (room, member, key, reason))

    def reports(self, room):
        return [dict(row) for row in self.db.execute(
            "SELECT id,message,reason FROM reports WHERE room=? AND resolved=0 ORDER BY id LIMIT 50", (room,)
        )]

    def resolve(self, room, report):
        with self.db:
            self.db.execute("UPDATE reports SET resolved=1 WHERE room=? AND id=?", (room, report))


def backup_database(source, destination):
    """Take a consistent snapshot of the live DB, including attachments and WAL commits."""
    source = Path(source).resolve()
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    os.close(os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600))
    try:
        with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as live:
            with closing(sqlite3.connect(destination)) as snapshot:
                live.backup(snapshot)
                if snapshot.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise RuntimeError("Chat backup failed integrity verification")
    except BaseException:
        destination.unlink(missing_ok=True)
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create and verify a Learn chat backup")
    parser.add_argument("destination", help="Path for a new, private snapshot file")
    parser.add_argument("--source", default=os.getenv("CHAT_DB", ".data/chat.sqlite3"))
    args = parser.parse_args()
    backup_database(args.source, args.destination)
