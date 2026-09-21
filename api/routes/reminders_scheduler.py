import datetime
import random
import sys
from typing import Any, Dict, Optional
from zoneinfo import ZoneInfo

from croniter import croniter

DEFAULT_TIMEZONE = "Asia/Jakarta"


def get_tz(tz_name: Optional[str]) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name or DEFAULT_TIMEZONE)
    except Exception:
        return ZoneInfo(DEFAULT_TIMEZONE)


def calculate_next_run(
    cron_expr: str,
    tz_name: Optional[str] = DEFAULT_TIMEZONE,
    base_time: Optional[datetime.datetime] = None,
    cmetadata: Optional[Dict[str, Any]] = None,
    after_execution: bool = False,
) -> Optional[datetime.datetime]:
    if not cron_expr or not cron_expr.strip():
        return None

    tz = get_tz(tz_name)
    now_utc = base_time or datetime.datetime.now(datetime.timezone.utc)
    now_in_tz = now_utc.astimezone(tz)

    schedule = (cmetadata or {}).get("_schedule", {}) if isinstance(cmetadata, dict) else {}
    sched_type = schedule.get("type")

    limit_val = schedule.get("max_runs") or (cmetadata or {}).get("max_runs") or 1
    try:
        limit = max(1, int(limit_val))
    except (ValueError, TypeError):
        limit = 1

    daily_runs_data = (
        (cmetadata or {}).get("_daily_runs", {})
        if isinstance((cmetadata or {}).get("_daily_runs"), dict)
        else {}
    )
    today_str = now_in_tz.strftime("%Y-%m-%d")
    runs_today = (
        (daily_runs_data.get("count") or 0)
        if daily_runs_data.get("date") == today_str
        else 0
    )
    remaining_msgs = max(1, limit - runs_today)

    if sched_type == "random_interval":
        try:
            min_val = max(1, int(schedule.get("min_interval", 15)))
            max_val = max(min_val, int(schedule.get("max_interval", 60)))
            unit = schedule.get("unit", "minutes")
            min_secs = min_val * 60
            max_secs = max_val * 60
            if unit == "hours":
                min_secs *= 60
                max_secs *= 60

            if schedule.get("use_time_window"):
                start_str = (
                    schedule.get("window_start_time")
                    or schedule.get("start_time", "08:00")
                    or "08:00"
                )
                end_str = (
                    schedule.get("window_end_time")
                    or schedule.get("end_time", "20:00")
                    or "20:00"
                )
                s_h, s_m = [int(x) for x in start_str.split(":")[:2]]
                e_h, e_m = [int(x) for x in end_str.split(":")[:2]]
                s_secs = s_h * 3600 + s_m * 60
                e_secs = e_h * 3600 + e_m * 60
                if e_secs <= s_secs:
                    e_secs = s_secs + 3600

                now_secs = now_in_tz.hour * 3600 + now_in_tz.minute * 60 + now_in_tz.second
                window_span = max(1, e_secs - s_secs)
                slot_step = max(1, window_span // limit)

                if runs_today >= limit:
                    next_day_tz = now_in_tz + datetime.timedelta(days=1)
                    jitter = random.randint(0, max(0, slot_step - 1))
                    cand_dt = next_day_tz.replace(
                        hour=s_h, minute=s_m, second=0, microsecond=0
                    ) + datetime.timedelta(seconds=jitter)
                    return cand_dt.astimezone(datetime.timezone.utc)

                if now_secs < s_secs:
                    offset = runs_today * slot_step
                    jitter = random.randint(0, max(0, slot_step - 1))
                    cand_dt = now_in_tz.replace(
                        hour=s_h, minute=s_m, second=0, microsecond=0
                    ) + datetime.timedelta(seconds=min(window_span - 1, offset + jitter))
                    return cand_dt.astimezone(datetime.timezone.utc)

                remaining_secs = max(0, e_secs - now_secs)
                if remaining_secs > 0:
                    step = max(1, remaining_secs // remaining_msgs)
                    delay = random.randint(
                        max(1, int(step * 0.4)), max(1, int(step * 1.6))
                    )
                    delay = min(delay, remaining_secs)
                    if delay <= 0:
                        delay = 1
                    cand_dt = now_in_tz + datetime.timedelta(seconds=delay)
                    return cand_dt.astimezone(datetime.timezone.utc)
                cand_dt = now_in_tz + datetime.timedelta(seconds=2)
                return cand_dt.astimezone(datetime.timezone.utc)

            delay_secs = random.randint(min_secs, max_secs)
            return now_utc + datetime.timedelta(seconds=delay_secs)
        except Exception as err:
            print(f"[Random Interval Calculation Warning] {err}", file=sys.stderr)

    elif sched_type == "daily_random":
        try:
            start_str = schedule.get("start_time", "09:00") or "09:00"
            end_str = schedule.get("end_time", "17:00") or "17:00"
            s_h, s_m = [int(x) for x in start_str.split(":")[:2]]
            e_h, e_m = [int(x) for x in end_str.split(":")[:2]]
            s_secs = s_h * 3600 + s_m * 60
            e_secs = e_h * 3600 + e_m * 60
            if e_secs <= s_secs:
                e_secs = s_secs + 3600

            now_secs = now_in_tz.hour * 3600 + now_in_tz.minute * 60 + now_in_tz.second
            window_span = max(1, e_secs - s_secs)
            slot_step = max(1, window_span // limit)

            if runs_today >= limit:
                tomorrow = now_in_tz + datetime.timedelta(days=1)
                jitter = random.randint(0, max(0, slot_step - 1))
                cand_tomorrow = tomorrow.replace(
                    hour=s_h, minute=s_m, second=0, microsecond=0
                ) + datetime.timedelta(seconds=jitter)
                return cand_tomorrow.astimezone(datetime.timezone.utc)

            if now_secs < s_secs:
                offset = runs_today * slot_step
                jitter = random.randint(0, max(0, slot_step - 1))
                cand_today = now_in_tz.replace(
                    hour=s_h, minute=s_m, second=0, microsecond=0
                ) + datetime.timedelta(seconds=min(window_span - 1, offset + jitter))
                return cand_today.astimezone(datetime.timezone.utc)

            if s_secs <= now_secs <= e_secs:
                remaining_secs = max(0, e_secs - now_secs)
                if remaining_secs > 0:
                    step = max(1, remaining_secs // remaining_msgs)
                    delay = random.randint(
                        max(1, int(step * 0.4)), max(1, int(step * 1.6))
                    )
                    delay = min(delay, remaining_secs)
                    if delay <= 0:
                        delay = 1
                    cand_today = now_in_tz + datetime.timedelta(seconds=delay)
                    return cand_today.astimezone(datetime.timezone.utc)
                cand_today = now_in_tz + datetime.timedelta(seconds=2)
                return cand_today.astimezone(datetime.timezone.utc)

            tomorrow = now_in_tz + datetime.timedelta(days=1)
            jitter = random.randint(0, max(0, slot_step - 1))
            cand_tomorrow = tomorrow.replace(
                hour=s_h, minute=s_m, second=0, microsecond=0
            ) + datetime.timedelta(seconds=jitter)
            return cand_tomorrow.astimezone(datetime.timezone.utc)
        except Exception as err:
            print(f"[Daily Random Window Warning] {err}", file=sys.stderr)

    elif sched_type == "weekly_random":
        try:
            start_str = schedule.get("start_time", "09:00") or "09:00"
            end_str = schedule.get("end_time", "17:00") or "17:00"
            s_h, s_m = [int(x) for x in start_str.split(":")[:2]]
            e_h, e_m = [int(x) for x in end_str.split(":")[:2]]
            s_secs = s_h * 3600 + s_m * 60
            e_secs = e_h * 3600 + e_m * 60
            if e_secs <= s_secs:
                e_secs = s_secs + 3600

            active_js_days = set(schedule.get("days", [1, 2, 3, 4, 5]))
            if not active_js_days:
                active_js_days = {1, 2, 3, 4, 5}

            today_js_dow = (now_in_tz.weekday() + 1) % 7
            is_today_active = today_js_dow in active_js_days
            window_span = max(1, e_secs - s_secs)
            slot_step = max(1, window_span // limit)

            if is_today_active and runs_today < limit:
                now_secs = now_in_tz.hour * 3600 + now_in_tz.minute * 60 + now_in_tz.second
                if now_secs < s_secs:
                    offset = runs_today * slot_step
                    jitter = random.randint(0, max(0, slot_step - 1))
                    cand_today = now_in_tz.replace(
                        hour=s_h, minute=s_m, second=0, microsecond=0
                    ) + datetime.timedelta(seconds=min(window_span - 1, offset + jitter))
                    return cand_today.astimezone(datetime.timezone.utc)

                if s_secs <= now_secs <= e_secs:
                    remaining_secs = max(0, e_secs - now_secs)
                    if remaining_secs > 0:
                        step = max(1, remaining_secs // remaining_msgs)
                        delay = random.randint(
                            max(1, int(step * 0.4)), max(1, int(step * 1.6))
                        )
                        delay = min(delay, remaining_secs)
                        if delay <= 0:
                            delay = 1
                        cand_today = now_in_tz + datetime.timedelta(seconds=delay)
                        return cand_today.astimezone(datetime.timezone.utc)
                    cand_today = now_in_tz + datetime.timedelta(seconds=2)
                    return cand_today.astimezone(datetime.timezone.utc)

            for offset_days in range(1, 15):
                test_day = now_in_tz + datetime.timedelta(days=offset_days)
                js_dow = (test_day.weekday() + 1) % 7
                if js_dow in active_js_days:
                    jitter = random.randint(0, max(0, slot_step - 1))
                    cand = test_day.replace(
                        hour=s_h, minute=s_m, second=0, microsecond=0
                    ) + datetime.timedelta(seconds=jitter)
                    return cand.astimezone(datetime.timezone.utc)
        except Exception as err:
            print(f"[Weekly Random Window Warning] {err}", file=sys.stderr)

    clean_expr = cron_expr.strip()
    if not croniter.is_valid(clean_expr):
        return None

    try:
        calc_base = (
            (now_in_tz + datetime.timedelta(minutes=1))
            if after_execution
            else now_in_tz
        )
        iter_obj = croniter(clean_expr, calc_base)
        next_dt = iter_obj.get_next(datetime.datetime)
        return next_dt.astimezone(datetime.timezone.utc)
    except Exception as err:
        print(f"[Cron Calculation Warning] {err}", file=sys.stderr)
        return None


__all__ = [
    "DEFAULT_TIMEZONE",
    "get_tz",
    "calculate_next_run",
]
