import json
import re
import sys
import time
import zoneinfo
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import httpx
from langchain_core.tools import tool

from config import INTERNAL_API_KEY, INTERNAL_TOKEN, JWT_SECRET, NEXTJS_URL
from reminder_service import resolve_reminder_recipient

_http_client: Optional[httpx.Client] = None


def _get_http_client() -> httpx.Client:
    """Provide a persistent, pooled HTTP client with keep-alive for production workloads."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.Client(
            timeout=12.0,
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=30.0),
        )
    return _http_client


def _gateway_auth_headers() -> Dict[str, str]:
    internal_secret = INTERNAL_API_KEY or INTERNAL_TOKEN or JWT_SECRET
    return {"X-Internal-Secret": internal_secret}


def _format_inline_placeholders(text: str) -> str:
    """Format any standard dynamic placeholders such as {time_now}, {date_now}, or {datetime_now}."""
    if "{" not in text or "}" not in text:
        return text

    try:
        now_local = datetime.now(zoneinfo.ZoneInfo("Asia/Jakarta"))
        formatted = text
        formatted = re.sub(r"\{(?:datetime_now|datetime|waktu_sekarang)\}", now_local.strftime("%d/%m/%Y %H:%M"), formatted)
        formatted = re.sub(r"\{(?:date_now|date|tanggal)\}", now_local.strftime("%d/%m/%Y"), formatted)
        formatted = re.sub(r"\{(?:time_now|time|waktu|jam)\}", now_local.strftime("%H:%M"), formatted)
        return formatted
    except Exception:
        return text


@tool
def send_message(
    message: str,
    recipient: Optional[str] = None,
    channel_type: Optional[str] = "WHATSAPP",
    title: Optional[str] = None,
) -> str:
    """Send an immediate message, notification, or forwarded content to a user, phone number, group, or channel.
    Call this tool whenever the user asks to send, forward, or deliver a message right now to a recipient.

    Args:
        message: The message content to send immediately.
        recipient: Target recipient phone number, group name or ID, 'me'/'current' for current chat, or 'ALL'. If omitted, defaults to the current chat/user. For multiple recipients, separate with commas.
        channel_type: Delivery channel ('WHATSAPP', 'TELEGRAM', or 'WEB'). Default is 'WHATSAPP'.
        title: Optional title or subject header for the message.
    """
    if not message or not message.strip():
        return json.dumps({"status": "error", "error": "message parameter is required"})

    clean_msg = _format_inline_placeholders(message.strip())
    if title and title.strip():
        clean_title = title.strip()
        if not clean_msg.startswith(clean_title) and not clean_msg.startswith(f"*{clean_title}*"):
            clean_msg = f"*{clean_title}*\n\n{clean_msg}"

    clean_channel = (channel_type or "WHATSAPP").upper().strip()
    if clean_channel not in ("WHATSAPP", "TELEGRAM", "WEB"):
        clean_channel = "WHATSAPP"

    # Resolve target recipient(s)
    resolved_recipients: List[str] = []
    raw_recipients: List[str] = []

    if recipient:
        if isinstance(recipient, list):
            raw_recipients = [str(r).strip() for r in recipient if str(r).strip()]
        else:
            clean_r_str = str(recipient).strip()
            # Strip noise prefixes like 'nomor ', 'no: ', 'ke: ', 'to ' if present
            clean_r_str = re.sub(r'^(?:ke|to|nomor|no\.?|number)[:\s]+', '', clean_r_str, flags=re.IGNORECASE).strip()
            parts = re.split(r'[,;\n]+', clean_r_str)
            raw_recipients = [p.strip() for p in parts if p.strip()]

    if not raw_recipients:
        resolved = resolve_reminder_recipient(None, clean_channel)
        if resolved:
            resolved_recipients.append(resolved)
        elif clean_channel == "WHATSAPP":
            return json.dumps({
                "status": "error",
                "error": "No recipient specified. Please provide a destination phone number or group name."
            })
        else:
            resolved_recipients.append("default")
    else:
        for raw in raw_recipients:
            raw_clean = re.sub(r'^(?:ke|to|nomor|no\.?|number)[:\s]+', '', raw, flags=re.IGNORECASE).strip()
            resolved = resolve_reminder_recipient(raw_clean, clean_channel)
            if resolved and resolved not in resolved_recipients:
                resolved_recipients.append(resolved)

    if not resolved_recipients:
        return json.dumps({
            "status": "error",
            "error": "Could not resolve any valid recipient for delivery."
        })

    client = _get_http_client()

    # Dispatch to appropriate channel with transient retry
    max_retries = 2
    for attempt in range(max_retries):
        try:
            if clean_channel == "WHATSAPP":
                url = f"{NEXTJS_URL}/api/channel/whatsapp"
                payload = {
                    "channel_id": "default",
                    "action": "broadcast",
                    "recipients": resolved_recipients,
                    "message": clean_msg,
                }
                resp = client.post(url, json=payload, headers=_gateway_auth_headers())
                if resp.status_code >= 400:
                    err_msg = resp.text
                    try:
                        err_json = resp.json()
                        err_msg = err_json.get("error") or err_json.get("message") or resp.text
                    except Exception:
                        pass
                    return json.dumps({
                        "status": "error",
                        "error": f"WhatsApp gateway error ({resp.status_code}): {err_msg}"
                    })

                resp_data = resp.json()
                if not resp_data.get("success", False):
                    errors = resp_data.get("errors", [])
                    return json.dumps({
                        "status": "error",
                        "error": f"Failed to deliver WhatsApp message: {', '.join(errors) if errors else 'Unknown delivery error'}"
                    })

                return json.dumps({
                    "status": "success",
                    "message": "Message sent successfully.",
                    "channel": "WHATSAPP",
                    "recipient": ", ".join(resolved_recipients),
                    "sent_count": resp_data.get("sentCount", len(resolved_recipients)),
                    "content": clean_msg
                }, ensure_ascii=False)

            elif clean_channel == "TELEGRAM":
                url = f"{NEXTJS_URL}/api/channel/telegram"
                payload = {
                    "channel_id": "default",
                    "action": "broadcast",
                    "recipients": resolved_recipients,
                    "message": clean_msg,
                }
                resp = client.post(url, json=payload, headers=_gateway_auth_headers())
                if resp.status_code >= 400:
                    err_msg = resp.text
                    try:
                        err_json = resp.json()
                        err_msg = err_json.get("error") or err_json.get("message") or resp.text
                    except Exception:
                        pass
                    return json.dumps({
                        "status": "error",
                        "error": f"Telegram gateway error ({resp.status_code}): {err_msg}"
                    })

                resp_data = resp.json()
                if not resp_data.get("success", False):
                    errors = resp_data.get("errors", [])
                    return json.dumps({
                        "status": "error",
                        "error": f"Failed to deliver Telegram message: {', '.join(errors) if errors else 'Unknown delivery error'}"
                    })

                return json.dumps({
                    "status": "success",
                    "message": "Message sent successfully.",
                    "channel": "TELEGRAM",
                    "recipient": ", ".join(resolved_recipients),
                    "sent_count": resp_data.get("sentCount", len(resolved_recipients)),
                    "content": clean_msg
                }, ensure_ascii=False)

            else:
                # WEB channel
                return json.dumps({
                    "status": "success",
                    "message": "Message sent successfully.",
                    "channel": "WEB",
                    "recipient": ", ".join(resolved_recipients) if resolved_recipients != ["default"] else "Web User",
                    "content": clean_msg
                }, ensure_ascii=False)

        except (httpx.ConnectError, httpx.ConnectTimeout) as conn_err:
            if attempt < max_retries - 1:
                time.sleep(0.5)
                continue
            return json.dumps({
                "status": "error",
                "error": f"Channel gateway connection failed: {conn_err}"
            })
        except httpx.TimeoutException:
            if attempt < max_retries - 1:
                time.sleep(0.5)
                continue
            return json.dumps({
                "status": "error",
                "error": "Channel gateway timed out while delivering the message."
            })
        except Exception as exc:
            return json.dumps({
                "status": "error",
                "error": f"Unexpected error while sending message: {str(exc)}"
            })


send_messages = send_message
