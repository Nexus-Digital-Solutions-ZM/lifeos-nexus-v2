from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Personnel, User
from app.schemas import PersonnelCreate, PersonnelUpdate, PersonnelOut
from app.core.security import get_current_user
from app.core.websocket_manager import ws_manager

router = APIRouter(prefix="/personnel", tags=["personnel"])


@router.get("/", response_model=List[PersonnelOut])
def list_personnel(
    area: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Personnel)
    if area:
        q = q.filter(Personnel.area == area)
    if status:
        q = q.filter(Personnel.status == status)
    return q.order_by(Personnel.full_name).all()


@router.post("/", response_model=PersonnelOut, status_code=201)
async def create_personnel(
    payload: PersonnelCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    person = Personnel(**payload.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    await ws_manager.broadcast("personnel:created", PersonnelOut.model_validate(person).model_dump(mode="json"))
    return person


@router.get("/{person_id}", response_model=PersonnelOut)
def get_person(
    person_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    person = db.query(Personnel).filter(Personnel.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.patch("/{person_id}", response_model=PersonnelOut)
async def update_person(
    person_id: int,
    payload: PersonnelUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    person = db.query(Personnel).filter(Personnel.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(person, field, value)
    db.commit()
    db.refresh(person)
    await ws_manager.broadcast("personnel:updated", PersonnelOut.model_validate(person).model_dump(mode="json"))
    return person


@router.delete("/{person_id}", status_code=204)
async def delete_person(
    person_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    person = db.query(Personnel).filter(Personnel.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    db.delete(person)
    db.commit()
    await ws_manager.broadcast("personnel:deleted", {"id": person_id})
