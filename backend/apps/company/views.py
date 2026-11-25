from conf.responses import CustomJSONResponse
from models import Membership, User


async def get_team_members_view(team_id: str):
    members = (
        await Membership.filter(team_id=team_id)
        .select_related("user")
        .values(id="user__id", name="user__name")
    )
    admins = await User.filter(role=User.Role.ADMIN).values(id="id", name="name")
    members_by_id = {member["id"]: member for member in members}
    members_by_id.update({admin["id"]: admin for admin in admins})

    return CustomJSONResponse(content={"data": list(members_by_id.values())})
