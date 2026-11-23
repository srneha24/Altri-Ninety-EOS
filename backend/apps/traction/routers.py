from conf.permissions import IsAuthenticated
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/traction",
    tags=["traction"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(IsAuthenticated())],
)
