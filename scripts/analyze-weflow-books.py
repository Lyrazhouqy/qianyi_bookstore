#!/usr/bin/env python3
"""Discover titles from a WeFlow corpus before selecting game books or comments."""
import argparse
import collections
import datetime
import hashlib
import json
import os
import re
import unicodedata
from pathlib import Path


def norm(text):
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", text))


def clean_mentions(text):
    text = re.sub(r"「[^」\n]*」\s*\n?- - -[^\n]*\n?", "", text)
    text = re.sub(r"@[^\n\u2005]+\u2005", "", text)
    return re.sub(r"@\S+", "", text)


def excluded(row):
    text = row["content"]
    if row["type"] != "文本":
        return "non_text"
    if row["sender"] == "小助手":
        return "assistant_sender"
    if "#Group Note" in text or "#接龙" in text or (
        re.search(r"阅读计划|年度最佳书籍|推荐书单", text)
        and re.search(r"^\s*\d+[.、．)]", text, re.M)
    ):
        return "roster_or_plan_chain"
    if re.search(r"嗯[，,]用户的?问题|我需要结合搜索结果|这张聊天记录非常有深度|以下是对这段对话的详细解析|你想学《|以下是其核心主题和传达的道理", text):
        return "recognizable_pasted_ai"
    return None


def run(source, output, review_path=None):
    raw = source.read_bytes()
    data = json.loads(raw)
    rows = data["messages"]
    vocabulary = {norm(t) for row in rows for t in re.findall(r"《([^《》\n]{1,65})》", row["content"])}
    review = json.loads(review_path.read_text()) if review_path else {}
    aliases = review.get("aliases", {})
    pattern = re.compile("|".join(re.escape(t) for t in sorted(vocabulary | set(aliases), key=lambda t: (-len(t), t)) if len(t) >= 3))
    titles = collections.defaultdict(lambda: {"raw_bracket_indices": [], "hits": []})
    filters, seen_long, seen_short = collections.Counter(), set(), set()
    authors = {s: f"署名{i+1:02}" for i, s in enumerate(dict.fromkeys(r["sender"] for r in rows))}
    for i, row in enumerate(rows):
        for title in {norm(t) for t in re.findall(r"《([^《》\n]{1,65})》", row["content"])}:
            titles[aliases.get(title, title)]["raw_bracket_indices"].append(i)
        reason = excluded(row)
        if reason:
            filters[reason] += 1
            continue
        text = clean_mentions(row["content"])
        if text != row["content"]:
            filters["mention_or_quote_header_cleaned"] += 1
        normalized = norm(text)
        key = (row["sender"], row["time"][:10], normalized)
        duplicate = normalized in seen_long if len(normalized) >= 120 else key in seen_short
        if duplicate:
            filters["duplicate_text"] += 1
            continue
        if len(normalized) >= 120:
            seen_long.add(normalized)
        else:
            seen_short.add(key)
        matches = {aliases.get(m.group(), m.group()) for m in pattern.finditer(normalized)}
        matches |= {aliases.get(norm(t), norm(t)) for t in re.findall(r"《([^《》\n]{1,65})》", text)}
        for title in matches:
            if title in review.get("excluded_titles", {}):
                continue
            rule = review.get("titles", {}).get(title, {})
            if "allow_indices" in rule and i not in rule["allow_indices"] or i in rule.get("exclude_indices", []):
                continue
            if any(norm(phrase) in normalized for phrase in rule.get("exclude_phrases", [])):
                continue
            titles[title]["hits"].append({"source_index": i, "time": row["time"],
                                          "author": authors[row["sender"]],
                                          "groupNickname": row["sender"] or None,
                                          "cleaned_text": text,
                                          "content_sha256": hashlib.sha256(row["content"].encode()).hexdigest()})
    result = []
    for title, record in titles.items():
        hits = record["hits"]
        if not hits:
            continue
        rule = review.get("titles", {}).get(title, {})
        result.append({"title": title, "mentions": len(hits), "export_senders": len({h["author"] for h in hits}),
                       "days": len({h["time"][:10] for h in hits}),
                       "group_nicknames": list(dict.fromkeys(h["groupNickname"] for h in hits)),
                       "raw_bracket_mentions": len(record["raw_bracket_indices"]),
                       "reviewed": bool(rule.get("reviewed")), "editor_note": rule.get("note", ""),
                       "hits": hits})
    result.sort(key=lambda r: (-r["mentions"], -r["export_senders"], -r["days"], r["title"]))
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    output.chmod(0o700)
    report = {"at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "source_file": str(source),
              "source_sha256": hashlib.sha256(raw).hexdigest(), "chat": data["chat"], "messages": len(rows),
              "range": [rows[0]["time"], rows[-1]["time"]], "discovered_title_candidates": len(vocabulary),
              "filters": dict(filters), "method": "titles discovered from corpus brackets; bare-title matching uses this vocabulary; longest match; exact long reposts collapsed, short text deduped per sender/day; manual semantic review where supplied",
              "limits": "explicit or bare title mentions only, not all comments in a conversation; aliases are export labels, not verified people; original passages without a title are not automatically attributed; unmarked copied AI may remain; media not transcribed",
              "titles": result}
    path = output / "book-discussion.json"
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    path.chmod(0o600)
    for record in result[:35]:
        print(json.dumps({k: record[k] for k in ["title", "mentions", "export_senders", "days", "raw_bracket_mentions", "reviewed"]}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--review", type=Path)
    args = parser.parse_args()
    os.umask(0o077)
    run(args.source.resolve(), args.output.resolve(), args.review.resolve() if args.review else None)
