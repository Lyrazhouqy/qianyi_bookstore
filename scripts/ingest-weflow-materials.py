#!/usr/bin/env python3
"""Build a local, source-linked editorial batch without changing the live game pool."""
import argparse
import collections
import datetime
import hashlib
import json
import os
from pathlib import Path


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_private(path, value):
    path.write_text(value, encoding="utf-8")
    path.chmod(0o600)


def build(source, editorial, output):
    raw = source.read_bytes()
    corpus = json.loads(raw)
    selection = json.loads(editorial.read_text())
    source_hash = digest(raw)
    if source_hash != selection["source_sha256"]:
        raise ValueError("Source differs from the reviewed export")
    if corpus["chat"] != selection["source_chat"]:
        raise ValueError("Wrong source chat")
    rows = corpus["messages"]
    if corpus["count"] != len(rows):
        raise ValueError("Export count differs from messages")
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    output.chmod(0o700)
    speakers = {}
    notes, originals, books = [], [], {}
    for item in selection["notes"]:
        index = item["source_index"]
        msg = rows[index]
        original = msg["content"]
        quote = item["source_excerpt"]
        if msg["type"] != "文本" or msg["sender"] in selection["excluded_senders"]:
            raise ValueError(f"Non-human-text source at {index}")
        if not quote or quote not in original:
            raise ValueError(f"Excerpt does not match source at {index}")
        front = item["front"].strip()
        if not front or len(front) > 600 or "http" in front or "@" in front:
            raise ValueError(f"Invalid game text at {index}")
        sender = msg["sender"]
        alias = speakers.setdefault(sender, f"书友{len(speakers) + 1:02}")
        display_name = sender.strip() if selection.get("author_display") == "group_nickname" and sender.strip() else alias
        message_hash = digest(original.encode())
        note_id = "qianyi-" + digest(f"{source_hash}:{index}:{message_hash}".encode())[:16]
        ref = {"source_index": index, "json_pointer": f"/messages/{index}",
               "local_id": msg["local_id"], "time": msg["time"],
               "timestamp": msg["timestamp"], "content_sha256": message_hash}
        note = {"id": note_id, "kind": "stack", "author": "qianyi-" + alias[-2:],
                "authorName": display_name, "groupNickname": sender.strip() or None,
                "anonymousAlias": alias, "front": front, "back": "", "stock": "cream",
                "replies": [], "source": ref, "original_excerpt": quote,
                "edit_note": item["edit_note"], "book_relation": item["book_relation"],
                "rhythm": item["rhythm"], "status": "editorial_candidate"}
        notes.append(note)
        originals.append({"note_id": note_id, "source": ref, "original_sender": sender,
                          "original_message": original})
        relation = item["book_relation"]
        if relation["kind"] == "explicit" and relation.get("game_book_id"):
            row = {k: note[k] for k in ("id", "kind", "author", "authorName", "front", "back", "stock", "replies")}
            books.setdefault(relation["game_book_id"], []).append(row)
    ids = [n["id"] for n in notes]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate source selection")
    for seq in selection.get("conversation_candidates", []):
        if not all(i in [n["source"]["source_index"] for n in notes] for i in seq["source_indices"]):
            raise ValueError("Conversation refers to an unselected source")
        if seq["relation"] != "same_topic_sequence_not_confirmed_direct_reply":
            raise ValueError("Unverified direct reply relation")
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    manifest = {"schema_version": 1, "created_at": now, "source_file": str(source),
                "source_sha256": source_hash, "source_bytes": len(raw), "source_chat": corpus["chat"],
                "message_count": len(rows), "text_count": sum(r["type"] == "文本" for r in rows),
                "types": dict(collections.Counter(r["type"] for r in rows)),
                "first_time": min(rows, key=lambda r: r["timestamp"])["time"],
                "last_time": max(rows, key=lambda r: r["timestamp"])["time"],
                "duplicate_local_id_occurrences": len(rows) - len({r["local_id"] for r in rows}),
                "identity_rule": "source hash + JSON array index + content hash; local_id alone is not unique",
                "notes": len(notes), "anonymized_export_senders": len(speakers),
                "direct_existing_book_notes": sum(map(len, books.values())),
                "existing_book_counts": {k: len(v) for k, v in books.items()},
                "new_book_notes": sum(n["book_relation"]["kind"] == "explicit" and not n["book_relation"].get("game_book_id") for n in notes),
                "unplaced_reading_notes": sum(n["book_relation"]["kind"] == "general_reading" for n in notes),
              "state": "local editorial intake; live fictional pool unchanged; no publish or upload",
              "author_display": selection.get("author_display", "anonymous"),
                "excluded": ["assistant messages", "book quotations", "group-note rosters", "media without transcription", "unverified reply links"],
                "conversation_candidates": selection.get("conversation_candidates", [])}
    write_private(output / "materials.json", json.dumps({"version": 1, "notes": notes}, ensure_ascii=False, indent=2) + "\n")
    write_private(output / "game-pool.candidate.json", json.dumps({"version": 1, "books": books}, ensure_ascii=False, indent=2) + "\n")
    write_private(output / "selected-originals.private.json", json.dumps(originals, ensure_ascii=False, indent=2) + "\n")
    review = ["# 谦益读书会 · 首批真实素材", "", "这批是本地编辑候选，未接入运行池。按用户要求保留导出记录中的群昵称；匿名编号只作索引。昵称不是经独立核验的真实身份，也不能保证是发言当时使用的昵称。", "",
              f"原导出：{manifest['message_count']:,}条；{manifest['first_time']}至{manifest['last_time']}。", "",
              f"{len(notes)}张便笺：现有书籍明确关联{manifest['direct_existing_book_notes']}张、新书候选{manifest['new_book_notes']}张、未指定书籍的阅读生活纸条{manifest['unplaced_reading_notes']}张。", "",
              "保留口语和具体经历；仅整理标点、口头语与身份称呼。来源中的书摘不冒充书友原创；同题相邻发言不自动变成回应。", ""]
    for number, note in enumerate(notes, 1):
        relation = note["book_relation"]
        placement = "《" + relation["title"] + "》" if relation["kind"] == "explicit" else "阅读生活纸条 · 书籍未定"
        review += [f"## {number:02} · {placement} · {note['authorName']}", "", note["front"], "",
                   f"节奏：{note['rhythm']}；{len(note['front'])}字。", "", "原话：", "",
                   "> " + note["original_excerpt"].replace("\n", "\n> "), "",
                   f"出处：{note['source']['time']}，JSON `/messages/{note['source']['source_index']}`；原local_id={note['source']['local_id']}。", "",
                   f"整理说明：{note['edit_note']}", ""]
    review += ["## 接续发言候选", "", "《悉达多》的年度推荐与十一分钟后的另一位书友同题发言已并列留档。导出没有直接回复字段，暂不写入游戏replies，也不称为玩家收到的新回应。", "",
               "## 尚未补齐", "", "《夜航西飞》暂未检出标题命中；不将旅行生活纸条冒称为对此书的读后感。图片、语音、链接未做内容识别，全文检索没有命中不等于这些媒体里从未谈过。", ""]
    write_private(output / "REVIEW.md", "\n".join(review))
    manifest["outputs"] = {n: {"sha256": digest((output / n).read_bytes()), "bytes": (output / n).stat().st_size}
                           for n in ["materials.json", "game-pool.candidate.json", "selected-originals.private.json", "REVIEW.md"]}
    write_private(output / "manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: manifest[k] for k in ["message_count", "notes", "anonymized_export_senders", "existing_book_counts", "new_book_notes", "unplaced_reading_notes", "state"]}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--editorial", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    os.umask(0o077)
    build(args.source.resolve(), args.editorial.resolve(), args.output.resolve())
