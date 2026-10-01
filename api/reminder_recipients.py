import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import httpx

from config import INTERNAL_API_KEY, INTERNAL_TOKEN, NEXTJS_URL


def normalize_whatsapp_recipient(recipient_str: str) -> str:
    r = recipient_str.strip()
    if not r or r.upper() in ("ALL", "ALL USERS", "SEMUA"):
        return "ALL"
    if r.endswith("@g.us") or r.endswith("@lid"):
        return r
    if (r.startswith("120363") and len(r) >= 16) or bool(re.match(r"^\d{8,15}-\d{8,12}$", r)):
        return f"{r}@g.us"
    if r.endswith("@s.whatsapp.net"):
        c_dig = re.sub(r"\D", "", r.split("@")[0])
        if c_dig.startswith("08") and len(c_dig) >= 9:
            c_dig = "62" + c_dig[1:]
        return f"{c_dig}@s.whatsapp.net" if c_dig else r
    if re.search(r"[a-zA-Z]", r):
        return r
    c_dig = re.sub(r"\D", "", r)
    if c_dig.startswith("08") and len(c_dig) >= 9:
        c_dig = "62" + c_dig[1:]
    if len(c_dig) >= 7:
        return f"{c_dig}@s.whatsapp.net"
    return r


_whatsapp_groups_cache: Dict[str, Any] = {"data": [], "timestamp": 0.0}


def fetch_whatsapp_groups_cached(channel_id: Optional[str] = None) -> List[Dict[str, Any]]:
    now_ts = time.time()
    chan_key = (channel_id or "default").strip()
    channels_cache = _whatsapp_groups_cache.setdefault("channels", {})
    chan_entry = channels_cache.get(chan_key, {})
    groups_data = chan_entry.get("data", [])
    last_ts = chan_entry.get("timestamp", 0.0)

    top_data = _whatsapp_groups_cache.get("data", [])
    top_ts = _whatsapp_groups_cache.get("timestamp", 0.0)
    if not groups_data and top_data and (abs(now_ts - top_ts) <= 60.0 or top_ts > now_ts):
        groups_data = top_data
        last_ts = top_ts

    if (now_ts - last_ts > 60.0 or not groups_data) and not (top_ts > now_ts and top_data):
        url = f"{NEXTJS_URL}/api/channel/whatsapp?action=groups&channel_id={chan_key}"
        headers: Dict[str, str] = {}
        secret = INTERNAL_API_KEY or INTERNAL_TOKEN
        if secret:
            headers["X-Internal-Secret"] = secret
        try:
            resp = httpx.get(url, headers=headers, timeout=3.0)
            if resp.status_code == 200:
                groups_data = resp.json().get("groups", [])
                channels_cache[chan_key] = {"data": groups_data, "timestamp": now_ts}
                _whatsapp_groups_cache["data"] = groups_data
                _whatsapp_groups_cache["timestamp"] = now_ts
        except Exception as err:
            print(f"[WARN] Failed to fetch WhatsApp groups for channel '{chan_key}': {err}", file=sys.stderr, flush=True)

    return groups_data


def _resolve_single_recipient(
    recipient: Optional[str],
    clean_channel: str,
    channel_id: Optional[str] = None,
) -> Optional[str]:
    clean_recipient = recipient.strip() if (recipient and recipient.strip()) else None

    if not channel_id:
        try:
            from chat_context import current_chat_channel_id_var
            channel_id = current_chat_channel_id_var.get()
        except Exception:
            pass

    default_names = {"default", "current", "me", "saya", "user", "current user", "current / default recipient"}
    if not clean_recipient or clean_recipient.lower() in default_names:
        try:
            from chat import current_chat_recipient_var
            ctx_rec = current_chat_recipient_var.get()
            if ctx_rec and ctx_rec.strip():
                clean_recipient = ctx_rec.strip()
        except Exception:
            pass

        if not clean_recipient or clean_recipient.lower() in default_names:
            try:
                channels_file = Path(__file__).resolve().parent.parent / "auth" / "channels.json"
                if channels_file.exists():
                    with open(channels_file, "r", encoding="utf-8") as f:
                        ch_data = json.load(f)
                        if isinstance(ch_data, list):
                            for c in ch_data:
                                bp = c.get("boundPhone")
                                if bp and bp.strip():
                                    clean_recipient = bp.strip()
                                    break
            except Exception:
                pass

    if clean_recipient and clean_recipient.lower() in ("all", "all users", "semua"):
        return "ALL"

    if clean_recipient and clean_recipient != "ALL" and clean_channel == "WHATSAPP":
        is_already_jid = (
            clean_recipient.endswith("@g.us")
            or clean_recipient.endswith("@s.whatsapp.net")
            or clean_recipient.endswith("@lid")
        )
        is_modern_group_id = bool(re.match(r"^120363\d{10,20}$", clean_recipient))
        is_legacy_group_id = bool(re.match(r"^\d{8,15}-\d{8,12}$", clean_recipient))

        if not is_already_jid and not is_modern_group_id and not is_legacy_group_id:
            try:
                groups_data = fetch_whatsapp_groups_cached(channel_id)
                matched = None
                clean_lower = clean_recipient.lower()
                clean_norm = re.sub(r"\s+", " ", clean_lower)

                for g in groups_data:
                    subj = g.get("subject", "").strip().lower()
                    if subj == clean_lower or re.sub(r"\s+", " ", subj) == clean_norm:
                        matched = g.get("id")
                        break

                if not matched and re.search(r"[a-zA-Z]", clean_recipient):
                    for g in groups_data:
                        subj = g.get("subject", "").lower()
                        if clean_lower in subj or subj in clean_lower:
                            matched = g.get("id")
                            break

                if matched:
                    clean_recipient = matched
            except Exception as err:
                print(f"[WARN] Failed to resolve WhatsApp group name '{clean_recipient}': {err}", file=sys.stderr, flush=True)

        return normalize_whatsapp_recipient(clean_recipient)

    return clean_recipient


def resolve_reminder_recipient(
    recipient: Optional[Union[str, List[str]]],
    clean_channel: str,
    channel_id: Optional[str] = None,
) -> Optional[str]:
    if isinstance(recipient, list):
        resolved_items: List[str] = []
        for r in recipient:
            if isinstance(r, str) and r.strip():
                res = _resolve_single_recipient(r.strip(), clean_channel, channel_id)
                if res and res.strip():
                    resolved_items.append(res.strip())
        if not resolved_items:
            return _resolve_single_recipient(None, clean_channel, channel_id)
        seen = set()
        unique = []
        for item in resolved_items:
            if item not in seen:
                seen.add(item)
                unique.append(item)
        return ", ".join(unique)

    if isinstance(recipient, str) and ("," in recipient or "\n" in recipient):
        single_res = _resolve_single_recipient(recipient, clean_channel, channel_id)
        if single_res and (single_res.endswith("@g.us") or single_res.endswith("@s.whatsapp.net")):
            return single_res
        parts = [p.strip() for p in recipient.replace("\n", ",").split(",") if p.strip()]
        if len(parts) > 1:
            resolved_items = []
            for p in parts:
                res = _resolve_single_recipient(p, clean_channel, channel_id)
                if res and res.strip():
                    resolved_items.append(res.strip())
            seen = set()
            unique = []
            for item in resolved_items:
                if item not in seen:
                    seen.add(item)
                    unique.append(item)
            return ", ".join(unique)

    return _resolve_single_recipient(recipient, clean_channel, channel_id)


__all__ = [
    "normalize_whatsapp_recipient",
    "_whatsapp_groups_cache",
    "fetch_whatsapp_groups_cached",
    "_resolve_single_recipient",
    "resolve_reminder_recipient",
]
