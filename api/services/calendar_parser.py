import datetime
import re
from typing import Any, Dict, Optional, Tuple
from croniter import croniter
import dateparser

_DATEPARSER_SETTINGS = {
    "REQUIRE_PARTS": ["day", "month"],
    "PARSERS": ["custom-formats", "absolute-time"],
}
_DATEPARSER_LANGUAGES = ["id", "en"]


def _format_once_schedule(
    target_dt: datetime.datetime,
    h: int,
    m: int,
    target_max_runs: int,
    tz_name: str,
) -> Dict[str, Any]:
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
                "max_runs": target_max_runs,
            },
        },
        "is_recurring": False,
        "next_run_at": target_dt.astimezone(datetime.timezone.utc),
        "description": f"One-time reminder at {target_dt.strftime('%d:%m:%Y %H:%M:%S')} {tz_name}",
    }


def _extract_time_of_day(s: str) -> Optional[Tuple[int, int]]:
    explicit_match = re.search(r'(?:pukul\s+|jam\s+|at\s+)?(\d{1,2})[:.](\d{2})', s)
    if explicit_match:
        return int(explicit_match.group(1)), int(explicit_match.group(2))
    prefix_match = re.search(r'(?:pukul\s+|jam\s+|at\s+)(\d{1,2})\s*(am|pm|pagi|siang|sore|malam)?', s)
    if prefix_match:
        h = int(prefix_match.group(1))
        mod = (prefix_match.group(2) or "").lower()
        if (mod in ("pm", "malam", "sore") or mod == "siang") and h < 12 and (mod != "siang" or h != 12):
            h += 12
        elif mod in ("am", "pagi") and h == 12:
            h = 0
        return h, 0
    mod_match = re.search(r'\b(\d{1,2})\s*(am|pm|pagi|siang|sore|malam)\b', s)
    if mod_match:
        h = int(mod_match.group(1))
        mod = mod_match.group(2).lower()
        if (mod in ("pm", "malam", "sore") or mod == "siang") and h < 12 and (mod != "siang" or h != 12):
            h += 12
        elif mod in ("am", "pagi") and h == 12:
            h = 0
        return h, 0
    return None


def _parse_candidate_month(candidate_str: str, expected_day: int) -> Optional[int]:
    parsed = dateparser.parse(
        candidate_str,
        languages=_DATEPARSER_LANGUAGES,
        settings=_DATEPARSER_SETTINGS,
    )
    if parsed is not None and parsed.day == expected_day:
        return parsed.month
    return None


def _extract_explicit_calendar_date(s: str) -> Optional[Tuple[int, int, Optional[int]]]:
    # 1. ISO numeric format: YYYY-MM-DD or YYYY/MM/DD
    m_iso = re.search(r'\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b', s)
    if m_iso:
        return int(m_iso.group(3)), int(m_iso.group(2)), int(m_iso.group(1))

    # 2. DMY numeric format: DD-MM-YYYY or DD/MM/YYYY
    m_dmy = re.search(r'(?:tanggal\s+|tgl\s+)?\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b', s)
    if m_dmy:
        return int(m_dmy.group(1)), int(m_dmy.group(2)), int(m_dmy.group(3))

    # 3. Named month, Day first with year: e.g. 10 Oktober 2026, 10-Okt-2026, 10th of October 2026
    for m in re.finditer(
        r'(?:tanggal\s+|tgl\s+)?\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:[-\s/]|of\s+)\s*([a-zA-Z]+)\s*[-\s/]\s*(\d{4})\b',
        s,
    ):
        d_val = int(m.group(1))
        mo = _parse_candidate_month(f"{d_val} {m.group(2)} {m.group(3)}", d_val)
        if mo is not None:
            return d_val, mo, int(m.group(3))

    # 4. Named month, Month first with year: e.g. October 10, 2026, Oct 10 2026
    for m in re.finditer(
        r'\b([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))\b',
        s,
    ):
        d_val = int(m.group(2))
        mo = _parse_candidate_month(f"{m.group(1)} {d_val} {m.group(3)}", d_val)
        if mo is not None:
            return d_val, mo, int(m.group(3))

    # 5. Named month, Day first without year: e.g. 10 Oktober, 10 Okt, 10th of October
    for m in re.finditer(
        r'(?:tanggal\s+|tgl\s+)?\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:[-\s/]|of\s+)\s*([a-zA-Z]+)\b',
        s,
    ):
        d_val = int(m.group(1))
        mo = _parse_candidate_month(f"{d_val} {m.group(2)}", d_val)
        if mo is not None:
            return d_val, mo, None

    # 6. Named month, Month first without year: e.g. October 10, Oct 10
    for m in re.finditer(
        r'\b([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\b',
        s,
    ):
        d_val = int(m.group(2))
        mo = _parse_candidate_month(f"{m.group(1)} {d_val}", d_val)
        if mo is not None:
            return d_val, mo, None

    return None


def parse_explicit_calendar_schedule(
    s: str,
    now_in_tz: datetime.datetime,
    tz: Any,
    tz_name: str,
    target_max_runs: int,
    datetime_module: Any = datetime,
) -> Optional[Dict[str, Any]]:
    cal_date = _extract_explicit_calendar_date(s)
    if not cal_date:
        return None

    d, mo, yr = cal_date
    t_match = _extract_time_of_day(s)
    h, m = t_match if t_match is not None else (6, 0)
    dt_cls = getattr(datetime_module, "datetime", datetime.datetime)

    if yr is None:
        yr = now_in_tz.year
        try:
            if dt_cls(yr, mo, d, h, m, 0, tzinfo=tz) <= now_in_tz:
                yr += 1
        except ValueError:
            pass
    try:
        target_dt = dt_cls(yr, mo, d, h, m, 0, tzinfo=tz)
        return _format_once_schedule(target_dt, h, m, target_max_runs, tz_name)
    except ValueError:
        return None


__all__ = [
    "_format_once_schedule",
    "_extract_time_of_day",
    "_extract_explicit_calendar_date",
    "parse_explicit_calendar_schedule",
]
