from conf.responses import CustomJSONResponse
from models import Membership


async def get_team_members_view(team_id: str):
    return CustomJSONResponse(
        content={
            "data": await Membership.filter(team_id=team_id)
            .select_related("user")
            .values(id="user__id", name="user__name")
        }
    )
