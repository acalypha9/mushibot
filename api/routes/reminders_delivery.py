import asyncio
import json
import urllib.error
import urllib.request
import zoneinfo
from datetime import datetime
from typing import Any, Dict, List, Optional

from models import CronReminder
from config import INTERNAL_API_KEY, INTERNAL_TOKEN, NEXTJS_URL


def _sync_deliver_reminder(
    channel_type: str,
    channel_id: str,
    recipients: List[str],
    formatted_msg: str,
    base_next_url: str,
    blacklist: Optional[List[str]] = None,
    allow_private: bool = True,
    allow_group: bool = True,
) -> Dict[str, Any]:
    result = {
        "channel": channel_type,
        "channel_id": channel_id,
        "recipients_count": len(recipients),
        "success": False,
        "detail": "",
    }

    try:
        if channel_type == "WHATSAPP":
            payload = {
                "channel_id": channel_id,
                "action": "broadcast",
                "recipients": recipients if recipients else ["default"],
                "blacklist": blacklist or [],
                "allowPrivate": allow_private,
                "allowGroup": allow_group,
                "message": formatted_msg,
            }
            url = f"{base_next_url}/api/channel/whatsapp"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "X-Internal-Secret": INTERNAL_API_KEY or INTERNAL_TOKEN,
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                result["success"] = resp_data.get("success", True)
                result["detail"] = f"WhatsApp delivery dispatched: {resp_data}"

        elif channel_type == "TELEGRAM":
            payload = {
                "channel_id": channel_id,
                "action": "broadcast",
                "recipients": recipients if recipients else ["default"],
                "blacklist": blacklist or [],
                "allowPrivate": allow_private,
                "allowGroup": allow_group,
                "message": formatted_msg,
            }
            url = f"{base_next_url}/api/channel/telegram"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "X-Internal-Secret": INTERNAL_API_KEY or INTERNAL_TOKEN,
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                result["success"] = resp_data.get("success", True)
                result["detail"] = f"Telegram delivery dispatched: {resp_data}"

        else:
            result["success"] = True
            result["detail"] = "In-app reminder logged successfully"
    except urllib.error.URLError as url_err:
        result["success"] = False
        result["detail"] = f"Channel gateway offline or unreachable: {url_err.reason}"
    except Exception as e:
        result["success"] = False
        result["detail"] = f"Delivery failed: {str(e)}"

    return result


def _format_dynamic_dt(now_dt: datetime, fmt_str: str, default_fmt: str = "%d/%m/%Y") -> str:
    f = (fmt_str or "").strip()
    if f in ("DD/MM/YYYY", "%d/%m/%Y", "dd/mm/yyyy"):
        return now_dt.strftime("%d/%m/%Y")
    if f in ("DD:MM:YYYY", "%d:%m:%Y", "dd:mm:yyyy"):
        return now_dt.strftime("%d:%m:%Y")
    if f in ("DD-MM-YYYY", "%d-%m-%Y", "dd-mm-yyyy"):
        return now_dt.strftime("%d-%m-%Y")
    if f in ("YYYY-MM-DD", "%Y-%m-%d", "yyyy-mm-dd"):
        return now_dt.strftime("%Y-%m-%d")
    if f in ("DD/MM/YYYY HH:mm", "%d/%m/%Y %H:%M"):
        return now_dt.strftime("%d/%m/%Y %H:%M")
    if f in ("DD:MM:YYYY HH:mm", "%d:%m:%Y %H:%M"):
        return now_dt.strftime("%d:%m:%Y %H:%M")
    if f in ("DD-MM-YYYY HH:mm", "%d-%m-%Y %H:%M"):
        return now_dt.strftime("%d-%m-%Y %H:%M")
    if f in ("YYYY-MM-DD HH:mm", "%Y-%m-%d %H:%M"):
        return now_dt.strftime("%Y-%m-%d %H:%M")
    if f in ("DD MMMM YYYY", "%d %B %Y"):
        return now_dt.strftime("%d %B %Y")
    if f in ("dddd, DD MMMM YYYY", "%A, %d %B %Y"):
        return now_dt.strftime("%A, %d %B %Y")
    if f in ("DD MMM YYYY", "%d %b %Y"):
        return now_dt.strftime("%d %b %Y")
    if f in ("HH:mm", "%H:%M"):
        return now_dt.strftime("%H:%M")
    if f in ("HH:mm:ss", "%H:%M:%S"):
        return now_dt.strftime("%H:%M:%S")
    if f in ("hh:mm A", "%I:%M %p"):
        return now_dt.strftime("%I:%M %p")
    if f in ("DD MMMM YYYY, HH:mm", "%d %B %Y, %H:%M"):
        return now_dt.strftime("%d %B %Y, %H:%M")
    try:
        return now_dt.strftime(f)
    except Exception:
        return now_dt.strftime(default_fmt)


def _format_reminder_message(
    msg_template: str,
    title: str,
    desc: str,
    now_dt: datetime,
    meta: Dict[str, Any],
) -> str:
    formatted_msg = msg_template
    if "{title}" in formatted_msg:
        formatted_msg = formatted_msg.replace("{title}", title)
    if "{description}" in formatted_msg and desc:
        formatted_msg = formatted_msg.replace("{description}", desc)
    if "{desc}" in formatted_msg and desc:
        formatted_msg = formatted_msg.replace("{desc}", desc)

    if "{date_now}" in formatted_msg:
        formatted_msg = formatted_msg.replace("{date_now}", now_dt.strftime("%d/%m/%Y"))
    if "{date}" in formatted_msg:
        formatted_msg = formatted_msg.replace("{date}", now_dt.strftime("%d/%m/%Y"))
    if "{time_now}" in formatted_msg:
        formatted_msg = formatted_msg.replace("{time_now}", now_dt.strftime("%H:%M"))
    if "{time}" in formatted_msg:
        formatted_msg = formatted_msg.replace("{time}", now_dt.strftime("%H:%M"))
    if "{datetime_now}" in formatted_msg:
        formatted_msg = formatted_msg.replace("{datetime_now}", now_dt.strftime("%d/%m/%Y %H:%M"))

    if isinstance(meta, dict):
        if "_variables" in meta and isinstance(meta["_variables"], list):
            for item in meta["_variables"]:
                if isinstance(item, dict):
                    k = item.get("key")
                    v_type = item.get("type", "text")
                    v_val = item.get("value", "")
                    if k:
                        clean_k = str(k).strip().replace("{", "").replace("}", "")
                        if v_type == "date_now":
                            val_str = _format_dynamic_dt(now_dt, v_val, "%Y-%m-%d")
                        elif v_type == "time_now":
                            val_str = _format_dynamic_dt(now_dt, v_val, "%H:%M")
                        elif v_type == "datetime_now":
                            val_str = _format_dynamic_dt(now_dt, v_val, "%Y-%m-%d %H:%M")
                        else:
                            val_str = str(v_val).strip()
                        placeholder = f"{{{clean_k}}}"
                        if placeholder in formatted_msg:
                            formatted_msg = formatted_msg.replace(placeholder, val_str)

        for k, v in meta.items():
            if k == "_variables":
                continue
            if k and v is not None:
                clean_k = str(k).strip().replace("{", "").replace("}", "")
                if isinstance(v, dict):
                    v_type = v.get("type", "text")
                    v_val = v.get("value", "")
                    if v_type == "date_now":
                        val_str = _format_dynamic_dt(now_dt, v_val, "%Y-%m-%d")
                    elif v_type == "time_now":
                        val_str = _format_dynamic_dt(now_dt, v_val, "%H:%M")
                    elif v_type == "datetime_now":
                        val_str = _format_dynamic_dt(now_dt, v_val, "%Y-%m-%d %H:%M")
                    else:
                        val_str = str(v_val).strip()
                else:
                    val_str = str(v).strip()
                placeholder = f"{{{clean_k}}}"
                if placeholder in formatted_msg:
                    formatted_msg = formatted_msg.replace(placeholder, val_str)

    return formatted_msg


async def execute_reminder_delivery(reminder: CronReminder) -> Dict[str, Any]:
    title = reminder.title or ""
    desc = reminder.description or ""
    msg_template = reminder.message or ""
    meta = reminder.cmetadata if isinstance(reminder.cmetadata, dict) else {}

    tz_name = reminder.timezone or "Asia/Jakarta"
    try:
        tz = zoneinfo.ZoneInfo(tz_name)
        now_dt = datetime.now(tz)
    except Exception:
        now_dt = datetime.now()

    formatted_msg = _format_reminder_message(msg_template, title, desc, now_dt, meta)

    channel_type = (reminder.channel_type or "WHATSAPP").upper()
    channel_id = reminder.channel_id or "default"
    raw_recipients = reminder.target_recipients or ""

    meta_rec = meta.get("_recipients", {}) if isinstance(meta, dict) else {}
    rec_mode = meta_rec.get("mode") if isinstance(meta_rec, dict) else None
    blacklist = meta_rec.get("blacklist", []) if isinstance(meta_rec, dict) else []
    allow_private = meta_rec.get("allow_private", True) if isinstance(meta_rec, dict) else True
    allow_group = meta_rec.get("allow_group", True) if isinstance(meta_rec, dict) else True

    if raw_recipients.startswith("ALL"):
        if "Private only" in raw_recipients:
            allow_private = True
            allow_group = False
        elif "Groups only" in raw_recipients:
            allow_private = False
            allow_group = True

    if rec_mode == "all" or raw_recipients.startswith("ALL"):
        recipients = ["ALL"]
    else:
        raw_list = [
            r.strip()
            for r in raw_recipients.replace(";", ",").replace("\n", ",").split(",")
            if r.strip()
        ]
        if channel_type == "WHATSAPP":
            import re
            normalized_recipients = []
            for r_item in raw_list:
                if r_item == "ALL":
                    normalized_recipients.append("ALL")
                elif r_item.endswith("@g.us") or r_item.endswith("@lid"):
                    normalized_recipients.append(r_item)
                elif r_item.startswith("120363"):
                    normalized_recipients.append(f"{r_item}@g.us")
                elif r_item.endswith("@s.whatsapp.net"):
                    c_dig = re.sub(r"\D", "", r_item.split("@")[0])
                    if c_dig.startswith("08") and len(c_dig) >= 9:
                        c_dig = "62" + c_dig[1:]
                    normalized_recipients.append(f"{c_dig}@s.whatsapp.net" if c_dig else r_item)
                else:
                    c_dig = re.sub(r"\D", "", r_item)
                    if c_dig.startswith("08") and len(c_dig) >= 9:
                        c_dig = "62" + c_dig[1:]
                    if len(c_dig) >= 7:
                        normalized_recipients.append(f"{c_dig}@s.whatsapp.net")
                    else:
                        normalized_recipients.append(r_item)
            recipients = normalized_recipients
        else:
            recipients = raw_list

    return await asyncio.to_thread(
        _sync_deliver_reminder,
        channel_type,
        channel_id,
        recipients,
        formatted_msg,
        NEXTJS_URL,
        blacklist,
        allow_private,
        allow_group,
    )


__all__ = [
    "execute_reminder_delivery",
]
