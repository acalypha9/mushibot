import re
import random
import datetime
from zoneinfo import ZoneInfo
from typing import Optional, Dict, Any
from croniter import croniter


def parse_natural_schedule(
    time_str: str,
    is_recurring: bool = False,
    tz_name: str = "Asia/Jakarta",
    message_limit: Optional[int] = None
) -> Dict[str, Any]:
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("Asia/Jakarta")
        tz_name = "Asia/Jakarta"

    now_in_tz = datetime.datetime.now(tz)
    s = time_str.strip().lower()

    detected_limit = None
    limit_match = re.search(r'(?:mengirim|kirim|sebanyak|limit|max(?:imum)?)?\s*(\d+)\s*(?:pesan|messages?|times?|kali|x\b)', s)
    if limit_match:
        detected_limit = max(1, int(limit_match.group(1)))

    target_max_runs = message_limit if (message_limit is not None and message_limit > 0) else (detected_limit or 1)

    parts = s.split()
    if len(parts) == 5 and croniter.is_valid(s):
        iter_obj = croniter(s, now_in_tz)
        next_dt = iter_obj.get_next(datetime.datetime).astimezone(datetime.timezone.utc)
        return {
            "cron_expression": s,
            "cmetadata": {"_schedule": {"type": "cron", "max_runs": target_max_runs}},
            "is_recurring": True,
            "next_run_at": next_dt,
            "description": f"Cron schedule: {s}"
        }

    day_map = {
        "senin": 1, "monday": 1, "mon": 1, "selasa": 2, "tuesday": 2, "tue": 2,
        "rabu": 3, "wednesday": 3, "wed": 3, "kamis": 4, "thursday": 4, "thu": 4,
        "jumat": 5, "jum'at": 5, "friday": 5, "fri": 5, "sabtu": 6, "saturday": 6, "sat": 6,
        "minggu": 0, "ahad": 0, "sunday": 0, "sun": 0
    }
    found_day = None
    for d_name, d_idx in day_map.items():
        if re.search(rf'\b{d_name}\b', s):
            found_day = d_idx
            break

    window_match = re.search(r'(?:between|antara|from|dari)?\s*(\d{1,2})[:.](\d{2})\s*(?:-|–|to|sampai|and|dan)\s*(\d{1,2})[:.](\d{2})', s)
    if window_match:
        s_h, s_m, e_h, e_m = (int(window_match.group(i)) for i in range(1, 5))
        start_time_str = f"{s_h:02d}:{s_m:02d}"
        end_time_str = f"{e_h:02d}:{e_m:02d}"

        sched_type = "weekly_random" if found_day is not None else "daily_random"
        cron_expr = f"{s_m} {s_h} * * {found_day}" if found_day is not None else f"{s_m} {s_h} * * *"

        cmetadata = {
            "_schedule": {
                "type": sched_type,
                "time_mode": "random_window",
                "start_time": start_time_str,
                "end_time": end_time_str,
                "days": [found_day] if found_day is not None else [],
                "max_runs": target_max_runs
            }
        }

        s_secs = s_h * 3600 + s_m * 60
        e_secs = e_h * 3600 + e_m * 60
        if e_secs <= s_secs:
            e_secs = s_secs + 3600

        now_secs = now_in_tz.hour * 3600 + now_in_tz.minute * 60 + now_in_tz.second
        window_span = max(1, e_secs - s_secs)
        slot_step = max(1, window_span // target_max_runs)

        if now_secs < s_secs:
            jitter = random.randint(0, max(0, slot_step - 1))
            cand_dt = now_in_tz.replace(hour=s_h, minute=s_m, second=0, microsecond=0) + datetime.timedelta(seconds=min(window_span - 1, jitter))
        elif now_secs <= e_secs:
            remaining_secs = max(0, e_secs - now_secs)
            if remaining_secs > 0:
                step = max(1, remaining_secs // target_max_runs)
                delay = random.randint(max(1, int(step * 0.4)), max(1, int(step * 1.6)))
                delay = min(delay, remaining_secs)
                if delay <= 0:
                    delay = 1
                cand_dt = now_in_tz + datetime.timedelta(seconds=delay)
            else:
                cand_dt = now_in_tz + datetime.timedelta(seconds=2)
        else:
            tomorrow = now_in_tz + datetime.timedelta(days=1)
            jitter = random.randint(0, max(0, slot_step - 1))
            cand_dt = tomorrow.replace(hour=s_h, minute=s_m, second=0, microsecond=0) + datetime.timedelta(seconds=jitter)

        desc = (
            f"Weekly reminder (Random {start_time_str}–{end_time_str} on day {found_day}) ({tz_name})"
            if found_day is not None
            else f"Every day at a random time between {start_time_str} and {end_time_str} - GMT+7 - {tz_name}"
        )

        return {
            "cron_expression": cron_expr,
            "cmetadata": cmetadata,
            "is_recurring": True,
            "next_run_at": cand_dt.astimezone(datetime.timezone.utc),
            "description": desc
        }

    rel_match = None
    if not ("every" in s or "setiap" in s or "between" in s or "antara" in s):
        rel_match = re.search(r'\b(?:in|dalam)\s+(\d+)\s*(mins?|minutes?|menit|hours?|jam|secs?|seconds?|detik)\b', s)
        if not rel_match:
            rel_match = re.search(r'\b(\d+)\s*(mins?|minutes?|menit|hours?|jam|secs?|seconds?|detik)\s+(?:lagi|later)\b', s)

    if rel_match:
        val = int(rel_match.group(1))
        unit = rel_match.group(2)
        if unit in ("hours", "hour", "jam"):
            delta = datetime.timedelta(hours=val)
            desc = f"In {val} hour(s)"
        elif unit in ("secs", "seconds", "second", "detik"):
            delta = datetime.timedelta(seconds=val)
            desc = f"In {val} second(s)"
        else:
            delta = datetime.timedelta(minutes=val)
            desc = f"In {val} minute(s)"

        target_dt = now_in_tz + delta
        cron_expr = f"{target_dt.minute} {target_dt.hour} {target_dt.day} {target_dt.month} *"
        if not croniter.is_valid(cron_expr):
            cron_expr = f"{target_dt.minute} {target_dt.hour} * * *"

        return {
            "cron_expression": cron_expr,
            "cmetadata": {
                "_schedule": {"type": "once", "target_time": target_dt.isoformat(), "max_runs": target_max_runs}
            },
            "is_recurring": False,
            "next_run_at": target_dt.astimezone(datetime.timezone.utc),
            "description": f"One-time reminder: {desc} ({target_dt.strftime('%d:%m:%Y %H:%M:%S')} {tz_name})"
        }

    is_tomorrow = "besok" in s or "tomorrow" in s
    time_match = None
    explicit_match = re.search(r'(?:jam\s+|at\s+)?(\d{1,2})[:.](\d{2})', s)
    if explicit_match:
        time_match = (int(explicit_match.group(1)), int(explicit_match.group(2)))
    else:
        ampm_match = re.search(r'(?:jam\s+|at\s+)?(\d{1,2})\s*(am|pm|pagi|siang|sore|malam)?', s)
        if ampm_match and ampm_match.group(1):
            h = int(ampm_match.group(1))
            m = 0
            mod = (ampm_match.group(2) or "").lower()
            if (mod in ("pm", "malam", "sore") or mod == "siang") and h < 12 and (mod != "siang" or h != 12):
                h += 12
            elif mod in ("am", "pagi") and h == 12:
                h = 0
            time_match = (h, m)

    if found_day is not None and time_match:
        h, m = time_match
        cron_expr = f"{m} {h} * * {found_day}"
        cmetadata = {
            "_schedule": {
                "type": "weekly_exact",
                "days": [found_day],
                "time": f"{h:02d}:{m:02d}",
                "max_runs": target_max_runs
            }
        }
        iter_obj = croniter(cron_expr, now_in_tz)
        next_dt = iter_obj.get_next(datetime.datetime).astimezone(datetime.timezone.utc)
        return {
            "cron_expression": cron_expr,
            "cmetadata": cmetadata,
            "is_recurring": True,
            "next_run_at": next_dt,
            "description": f"Weekly reminder on day {found_day} at {h:02d}:{m:02d} ({tz_name})"
        }

    interval_match = re.search(r'(?:every|setiap)\s+(\d+)\s*(mins?|minutes?|menit|hours?|jam)', s)
    if interval_match:
        ival = int(interval_match.group(1))
        unit = interval_match.group(2)
        if unit in ("hours", "hour", "jam"):
            cron_expr = f"0 */{ival} * * *"
            cmetadata = {"_schedule": {"type": "interval", "interval": ival * 60, "max_runs": target_max_runs}}
        else:
            cron_expr = f"*/{ival} * * * *"
            cmetadata = {"_schedule": {"type": "interval", "interval": ival, "max_runs": target_max_runs}}
        iter_obj = croniter(cron_expr, now_in_tz)
        next_dt = iter_obj.get_next(datetime.datetime).astimezone(datetime.timezone.utc)
        return {
            "cron_expression": cron_expr,
            "cmetadata": cmetadata,
            "is_recurring": True,
            "next_run_at": next_dt,
            "description": f"Repeating reminder every {ival} {unit} ({tz_name})"
        }

    is_everyday = "setiap hari" in s or "every day" in s or "everyday" in s or "daily" in s or is_recurring
    if time_match:
        h, m = time_match
        if is_everyday and not is_tomorrow:
            cron_expr = f"{m} {h} * * *"
            cmetadata = {
                "_schedule": {
                    "type": "daily_exact",
                    "time": f"{h:02d}:{m:02d}",
                    "max_runs": target_max_runs
                }
            }
            iter_obj = croniter(cron_expr, now_in_tz)
            next_dt = iter_obj.get_next(datetime.datetime).astimezone(datetime.timezone.utc)
            return {
                "cron_expression": cron_expr,
                "cmetadata": cmetadata,
                "is_recurring": True,
                "next_run_at": next_dt,
                "description": f"Daily reminder at {h:02d}:{m:02d} ({tz_name})"
            }
        else:
            if is_tomorrow:
                target_dt = (now_in_tz + datetime.timedelta(days=1)).replace(hour=h, minute=m, second=0, microsecond=0)
            else:
                cand_today = now_in_tz.replace(hour=h, minute=m, second=0, microsecond=0)
                if cand_today <= now_in_tz:
                    target_dt = (now_in_tz + datetime.timedelta(days=1)).replace(hour=h, minute=m, second=0, microsecond=0)
                else:
                    target_dt = cand_today

            cron_expr = f"{m} {h} {target_dt.day} {target_dt.month} *"
            if not croniter.is_valid(cron_expr):
                cron_expr = f"{m} {h} * * *"

            return {
                "cron_expression": cron_expr,
                "cmetadata": {
                    "is_recurring": False,
                    "_schedule": {
                        "type": "once",
                        "target_date": target_dt.strftime("%Y-%m-%d"),
                        "target_time": f"{h:02d}:{m:02d}",
                        "max_runs": 1
                    }
                },
                "is_recurring": False,
                "next_run_at": target_dt.astimezone(datetime.timezone.utc),
                "description": f"One-time reminder at {target_dt.strftime('%d:%m:%Y %H:%M:%S')} {tz_name}"
            }

    target_dt = now_in_tz + datetime.timedelta(hours=1)
    return {
        "cron_expression": f"{target_dt.minute} {target_dt.hour} * * *",
        "cmetadata": {
            "is_recurring": False,
            "_schedule": {
                "type": "once",
                "target_date": target_dt.strftime("%Y-%m-%d"),
                "target_time": f"{target_dt.hour:02d}:{target_dt.minute:02d}",
                "max_runs": 1
            }
        },
        "is_recurring": False,
        "next_run_at": target_dt.astimezone(datetime.timezone.utc),
        "description": f"One-time reminder at {target_dt.strftime('%d:%m:%Y %H:%M:%S')} {tz_name}"
    }
