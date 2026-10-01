import re
import uuid
from typing import Any, Dict, List, Optional, Union

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


__all__ = [
    "_parse_natural_schedule",
    "normalize_reminder_variables",
    "_resolve_single_recipient",
    "_whatsapp_groups_cache",
    "fetch_whatsapp_groups_cached",
    "normalize_whatsapp_recipient",
    "resolve_reminder_recipient",
]
