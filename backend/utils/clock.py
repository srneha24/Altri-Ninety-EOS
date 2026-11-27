import time
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

from conf.settings import APP_NOW

# Default timezone used when no specific company or team timezone is available
DEFAULT_TZ = "America/Chicago"

_company_tz_cache: dict[str, str] = {}
_team_tz_cache: dict[str, str] = {}
_anchor_monotonic: float = time.monotonic()
_frozen_now: datetime | None = None


def _parse_configured_app_now() -> datetime:
    raw = APP_NOW
    if raw.endswith("Z"):
        raw = f"{raw[:-1]}+00:00"
    parsed = datetime.fromisoformat(raw)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def freeze_app_now(dt: datetime | None = None) -> datetime:
    """Freeze get_app_now() at `dt` (or the configured APP_NOW) for deterministic tests."""
    global _frozen_now
    target = _parse_configured_app_now() if dt is None else dt
    if target.tzinfo is None:
        target = target.replace(tzinfo=UTC)
    _frozen_now = target.astimezone(UTC)
    return _frozen_now


def reset_app_clock() -> None:
    """Unfreeze the application clock and reset its monotonic anchor."""
    global _frozen_now, _anchor_monotonic
    _frozen_now = None
    _anchor_monotonic = time.monotonic()


def get_cached_tz(team_id: str | None = None, company_id: str | None = None) -> str:
    """Return the cached timezone for a team or company, defaulting to DEFAULT_TZ."""
    if team_id and team_id in _team_tz_cache:
        return _team_tz_cache[team_id]
    if company_id and company_id in _company_tz_cache:
        return _company_tz_cache[company_id]
    return DEFAULT_TZ


def get_app_now() -> datetime:
    """Return the advancing application 'now' timestamp as a UTC-aware datetime."""
    if _frozen_now is not None:
        return _frozen_now
    elapsed = max(0.0, time.monotonic() - _anchor_monotonic)
    return _parse_configured_app_now() + timedelta(seconds=elapsed)


async def get_app_today(
    *,
    team_id: str | None = None,
    company_id: str | None = None,
) -> date:
    """Return today's date in the company timezone, cached in memory by company/team."""

    from models import Company

    tz_name: str | None = None

    if company_id:
        tz_name = _company_tz_cache.get(company_id)
        if tz_name is None:
            company = await Company.get_or_none(id=company_id)
            if company:
                tz_name = company.timezone
                _company_tz_cache[company_id] = tz_name
    elif team_id:
        tz_name = _team_tz_cache.get(team_id)
        if tz_name is None:
            from models import Team

            team = await Team.get_or_none(id=team_id).select_related("company")
            if team and team.company:
                tz_name = team.company.timezone
                _team_tz_cache[team_id] = tz_name
                _company_tz_cache[team.company_id] = tz_name

    return get_app_now().astimezone(ZoneInfo(tz_name or DEFAULT_TZ)).date()
