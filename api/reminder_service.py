import datetime
import json
import re
import sys
import uuid
from typing import Any, Dict, List, Optional, Union
from langchain_core.tools import tool

from services.scheduler import parse_natural_schedule
from config import INTERNAL_API_KEY, INTERNAL_TOKEN, NEXTJS_URL


def _parse_natural_schedule(
    time_str: str,
    is_recurring: bool = False,
    tz_name: str = "Asia/Jakarta",
    message_limit: Optional[int] = None,
) -> dict:
    return parse_natural_schedule(
        time_str=time_str,
        is_recurring=is_recurring,
        tz_name=tz_name,
        message_limit=message_limit,
    )


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
    import time
    import httpx
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


def resolve_reminder_recipient(
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
                from pathlib import Path
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



def normalize_reminder_variables(
    clean_msg: str,
    variables: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None,
    existing_vars: Optional[List[Dict[str, Any]]] = None,
) -> tuple[str, List[Dict[str, Any]]]:
    vars_list: List[Dict[str, Any]] = []

    if variables:
        if isinstance(variables, list):
            for item in variables:
                if isinstance(item, dict):
                    k = str(item.get("key", "")).strip().replace("{", "").replace("}", "")
                    if k and k not in ("title", "is_recurring"):
                        v_type = item.get("type", "text")
                        if v_type not in ("text", "date_now", "time_now", "datetime_now", "number", "url"):
                            v_type = "text"
                        val = str(item.get("value", ""))
                        if not val and v_type == "date_now":
                            val = "DD/MM/YYYY"
                        elif not val and v_type == "time_now":
                            val = "HH:mm"
                        elif not val and v_type == "datetime_now":
                            val = "DD/MM/YYYY HH:mm"
                        vars_list.append({
                            "id": str(uuid.uuid4()),
                            "key": k,
                            "type": v_type,
                            "value": val
                        })
        elif isinstance(variables, dict):
            for k, v in variables.items():
                clean_k = str(k).strip().replace("{", "").replace("}", "")
                if clean_k and clean_k not in ("title", "is_recurring"):
                    if isinstance(v, dict):
                        v_type = v.get("type", "text")
                        if v_type not in ("text", "date_now", "time_now", "datetime_now", "number", "url"):
                            v_type = "text"
                        v_val = str(v.get("value", ""))
                    else:
                        v_type = "text"
                        v_val = str(v)
                    if not v_val and v_type == "date_now":
                        v_val = "DD/MM/YYYY"
                    elif not v_val and v_type == "time_now":
                        v_val = "HH:mm"
                    elif not v_val and v_type == "datetime_now":
                        v_val = "DD/MM/YYYY HH:mm"
                    vars_list.append({
                        "id": str(uuid.uuid4()),
                        "key": clean_k,
                        "type": v_type,
                        "value": v_val
                    })
    elif existing_vars:
        vars_list = list(existing_vars)

    found_placeholders = re.findall(r'\{([a-zA-Z0-9_-]+)\}', clean_msg)
    existing_keys = {v["key"] for v in vars_list}
    for ph in found_placeholders:
        if ph in ("title", "is_recurring") or ph in existing_keys:
            continue
        if ph in ("datetime_now", "datetime", "waktu_sekarang"):
            vars_list.append({
                "id": str(uuid.uuid4()),
                "key": ph,
                "type": "datetime_now",
                "value": "DD/MM/YYYY HH:mm"
            })
        elif ph in ("date_now", "date", "tanggal"):
            vars_list.append({
                "id": str(uuid.uuid4()),
                "key": ph,
                "type": "date_now",
                "value": "DD/MM/YYYY"
            })
        elif ph in ("time_now", "time", "waktu", "jam"):
            vars_list.append({
                "id": str(uuid.uuid4()),
                "key": ph,
                "type": "time_now",
                "value": "HH:mm"
            })
        else:
            vars_list.append({
                "id": str(uuid.uuid4()),
                "key": ph,
                "type": "text",
                "value": ""
            })
        existing_keys.add(ph)

    vars_list = [
        v for v in vars_list
        if v["key"] not in ("is_recurring", "title", "reason", "penjelasan", "keterangan", "dummy")
    ]

    has_datetime_var = any(v["key"] in ("datetime_now", "date_now", "time_now") for v in vars_list)
    has_datetime_placeholder = any(f"{{{ph}}}" in clean_msg for ph in ("datetime_now", "date_now", "time_now", "date", "time"))

    if not has_datetime_placeholder:
        clean_msg = f"{clean_msg}\n\nWaktu: {{datetime_now}}"
        if not has_datetime_var:
            vars_list.insert(0, {
                "id": str(uuid.uuid4()),
                "key": "datetime_now",
                "type": "datetime_now",
                "value": "DD/MM/YYYY HH:mm"
            })
    elif not has_datetime_var:
        if "{datetime_now}" in clean_msg:
            vars_list.insert(0, {
                "id": str(uuid.uuid4()),
                "key": "datetime_now",
                "type": "datetime_now",
                "value": "DD/MM/YYYY HH:mm"
            })
        elif "{date_now}" in clean_msg or "{date}" in clean_msg:
            vars_list.insert(0, {
                "id": str(uuid.uuid4()),
                "key": "date_now",
                "type": "date_now",
                "value": "DD/MM/YYYY"
            })
        elif "{time_now}" in clean_msg or "{time}" in clean_msg:
            vars_list.insert(0, {
                "id": str(uuid.uuid4()),
                "key": "time_now",
                "type": "time_now",
                "value": "HH:mm"
            })

    return clean_msg, vars_list
