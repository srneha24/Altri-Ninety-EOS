from conf.permissions import IsAuthenticated
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/company",
    tags=["company"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(IsAuthenticated())],
)
