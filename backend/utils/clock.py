from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

from conf.settings import APP_NOW, COMPANY_TIMEZONE
from models import Company

_company_tz_cache: dict[str, str] = {}
_team_tz_cache: dict[str, str] = {}


def get_app_now() -> datetime:
    """Return the configured application 'now' timestamp as a UTC-aware datetime."""
    raw = APP_NOW
    if raw.endswith("Z"):
        raw = f"{raw[:-1]}+00:00"
    parsed = datetime.fromisoformat(raw)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


async def get_app_today(
    *,
    team_id: str | None = None,
    company_id: str | None = None,
) -> date:
    """Return today's date in the company timezone, cached in memory by company/team."""
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

    return get_app_now().astimezone(ZoneInfo(tz_name or COMPANY_TIMEZONE)).date()
