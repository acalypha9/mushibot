import datetime as dt_mod
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

from reminder_recipients import (
    _resolve_single_recipient,
    _whatsapp_groups_cache,
    fetch_whatsapp_groups_cached,
    normalize_whatsapp_recipient,
    resolve_reminder_recipient,
)
from services.scheduler import parse_natural_schedule


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


DEFAULT_VAR_FORMATS = {
    "date_now": "DD/MM/YYYY",
    "time_now": "HH:mm",
    "datetime_now": "DD/MM/YYYY HH:mm",
}


def _extract_var_entry(k: Any, v: Any) -> Optional[Dict[str, Any]]:
    clean_k = str(k).strip().replace("{", "").replace("}", "")
    if not clean_k or clean_k in ("title", "is_recurring"):
        return None
    v_type = "text"
    v_val = ""
    if isinstance(v, dict):
        v_type = v.get("type", "text")
        v_val = str(v.get("value", ""))
    else:
        v_val = str(v)
    if v_type not in ("text", "date_now", "time_now", "datetime_now", "number", "url"):
        v_type = "text"
    v_val = v_val or DEFAULT_VAR_FORMATS.get(v_type, "")
    return {"id": str(uuid.uuid4()), "key": clean_k, "type": v_type, "value": v_val}


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
                    entry = _extract_var_entry(item.get("key", ""), item)
                    if entry:
                        vars_list.append(entry)
        elif isinstance(variables, dict):
            for k, v in variables.items():
                entry = _extract_var_entry(k, v)
                if entry:
                    vars_list.append(entry)
    elif existing_vars:
        vars_list = list(existing_vars)

    found_placeholders = re.findall(r'\{([a-zA-Z0-9_-]+)\}', clean_msg)
    existing_keys = {v["key"] for v in vars_list}
    ph_mappings = {
        ("datetime_now", "datetime", "waktu_sekarang"): ("datetime_now", "DD/MM/YYYY HH:mm"),
        ("date_now", "date", "tanggal"): ("date_now", "DD/MM/YYYY"),
        ("time_now", "time", "waktu", "jam"): ("time_now", "HH:mm"),
    }
    for ph in found_placeholders:
        if ph in ("title", "is_recurring") or ph in existing_keys:
            continue
        v_type, v_val = "text", ""
        for group, (t, val) in ph_mappings.items():
            if ph in group:
                v_type, v_val = t, val
                break
        vars_list.append({"id": str(uuid.uuid4()), "key": ph, "type": v_type, "value": v_val})
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
        for ph_token, ph_key in (
            ("{datetime_now}", "datetime_now"),
            ("{date_now}", "date_now"),
            ("{date}", "date_now"),
            ("{time_now}", "time_now"),
            ("{time}", "time_now"),
        ):
            if ph_token in clean_msg:
                vars_list.insert(0, {
                    "id": str(uuid.uuid4()),
                    "key": ph_key,
                    "type": ph_key,
                    "value": DEFAULT_VAR_FORMATS[ph_key],
                })
                break

    return clean_msg, vars_list


def canonicalize_reminder_recipients(rec: Optional[str]) -> str:
    if not rec:
        return ""
    parts = [p.strip() for p in rec.split(",") if p.strip()]
    parts.sort()
    return ", ".join(parts)


def canonicalize_reminder_next_run(dt: Any) -> Optional[dt_mod.datetime]:
    if dt is None:
        return None
    if isinstance(dt, str):
        try:
            dt = dt_mod.datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            return None
    if not isinstance(dt, dt_mod.datetime):
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=dt_mod.timezone.utc)
    return dt.astimezone(dt_mod.timezone.utc)


def normalize_reminder_message(msg: Optional[str]) -> str:
    if not msg:
        return ""
    return msg.replace("\r\n", "\n").strip()


def build_reminder_signature(
    channel_type: Optional[str],
    channel_id: Optional[str],
    canonical_recipients: Optional[str],
    next_run_at: Any,
    normalized_message: Optional[str],
) -> Tuple[str, str, str, Optional[dt_mod.datetime], str]:
    clean_chan = (channel_type or "WHATSAPP").upper()
    clean_chan_id = channel_id or "default"
    clean_rec = canonicalize_reminder_recipients(canonical_recipients)
    clean_next = canonicalize_reminder_next_run(next_run_at)
    clean_msg = normalize_reminder_message(normalized_message)
    return (clean_chan, clean_chan_id, clean_rec, clean_next, clean_msg)


def prepare_reminder_preflight(
    item: Any,
    active_channel_id: str,
    tz_name: str = "Asia/Jakarta",
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    clean_msg = item.message.strip()
    if not clean_msg:
        return None, "message parameter is required for all reminders"
    clean_time = item.time.strip()
    if not clean_time:
        return None, "time parameter is required for all reminders"

    if not item.title or not item.title.strip():
        first_line = clean_msg.split("\n")[0]
        clean_first = re.sub(r'[*_~`#]', '', first_line).strip()
        final_title = clean_first[:50].strip() if len(clean_first) > 3 else f"Reminder ({clean_time})"
    else:
        final_title = item.title.strip()

    try:
        parsed = _parse_natural_schedule(
            clean_time,
            is_recurring=bool(item.is_recurring),
            tz_name=tz_name,
            message_limit=item.message_limit,
        )
    except Exception as parse_err:
        return None, f"Failed to parse schedule '{clean_time}': {str(parse_err)}"

    clean_channel = (item.channel_type or "WHATSAPP").upper()
    clean_recipient = resolve_reminder_recipient(item.recipient, clean_channel, channel_id=active_channel_id)
    clean_msg, vars_list = normalize_reminder_variables(clean_msg, variables=item.variables)

    custom_meta = {k: v for k, v in dict(parsed.get("cmetadata", {})).items() if k != "title"}
    custom_meta["is_recurring"] = parsed.get("is_recurring", False)
    if vars_list:
        custom_meta["_variables"] = vars_list
        for v in vars_list:
            custom_meta[v["key"]] = {"type": v["type"], "value": v["value"]}

    return {
        "title": final_title,
        "clean_msg": clean_msg,
        "parsed": parsed,
        "clean_channel": clean_channel,
        "channel_id": active_channel_id,
        "clean_recipient": clean_recipient,
        "vars_list": vars_list,
        "custom_meta": custom_meta,
        "next_run_at": parsed.get("next_run_at"),
        "tz_name": tz_name,
    }, None


def format_reminder_dict(
    rec: Any,
    preflight: Dict[str, Any],
    is_existing: bool,
) -> Dict[str, Any]:
    next_run = rec.next_run_at or preflight["next_run_at"]
    next_run_str = (
        next_run.strftime("%d:%m:%Y %H:%M:%S UTC")
        if (next_run and hasattr(next_run, "strftime"))
        else (str(next_run) if next_run else None)
    )
    vars_list = preflight["vars_list"]
    return {
        "id": str(rec.id),
        "title": rec.title,
        "message": rec.message,
        "schedule": rec.description or preflight["parsed"].get("description"),
        "next_run_at": next_run_str,
        "timezone": rec.timezone or preflight["tz_name"],
        "channel": rec.channel_type,
        "recipient": rec.target_recipients or "Current / Default recipient",
        "is_recurring": preflight["parsed"].get("is_recurring", False),
        "variables": {v["key"]: v["value"] for v in vars_list} if vars_list else {},
        "already_scheduled": is_existing,
    }


__all__ = [
    "_parse_natural_schedule",
    "normalize_reminder_variables",
    "_resolve_single_recipient",
    "_whatsapp_groups_cache",
    "fetch_whatsapp_groups_cached",
    "normalize_whatsapp_recipient",
    "resolve_reminder_recipient",
    "canonicalize_reminder_recipients",
    "canonicalize_reminder_next_run",
    "normalize_reminder_message",
    "build_reminder_signature",
    "prepare_reminder_preflight",
    "format_reminder_dict",
]
