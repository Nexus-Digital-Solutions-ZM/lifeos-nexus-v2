from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models import FollowUp, User
from app.schemas import FollowUpCreate, FollowUpUpdate, FollowUpOut
from app.core.security import get_current_user
from app.core.websocket_manager import ws_manager

router = APIRouter(prefix="/followups", tags=["followups"])


@router.get("/", response_model=List[FollowUpOut])
def list_followups(
    done: Optional[bool] = None,
    priority: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(FollowUp)
    if done is not None:
        q = q.filter(FollowUp.done == done)
    if priority:
        q = q.filter(FollowUp.priority == priority)
    if project_id:
        q = q.filter(FollowUp.project_id == project_id)
    return q.order_by(FollowUp.created_at.desc()).all()


@router.post("/", response_model=FollowUpOut, status_code=201)
async def create_followup(
    payload: FollowUpCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    followup = FollowUp(**payload.model_dump())
    db.add(followup)
    db.commit()
    db.refresh(followup)
    await ws_manager.broadcast("followup:created", FollowUpOut.model_validate(followup).model_dump(mode="json"))
    return followup


@router.patch("/{followup_id}", response_model=FollowUpOut)
async def update_followup(
    followup_id: int,
    payload: FollowUpUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("done") and not followup.done:
        update_data["done_at"] = datetime.now(timezone.utc)
    for field, value in update_data.items():
        setattr(followup, field, value)
    db.commit()
    db.refresh(followup)
    await ws_manager.broadcast("followup:updated", FollowUpOut.model_validate(followup).model_dump(mode="json"))
    return followup


@router.delete("/{followup_id}", status_code=204)
async def delete_followup(
    followup_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    db.delete(followup)
    db.commit()
    await ws_manager.broadcast("followup:deleted", {"id": followup_id})


@router.get("/stats/summary")
def followup_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy import func
    total = db.query(func.count(FollowUp.id)).scalar()
    open_count = db.query(func.count(FollowUp.id)).filter(FollowUp.done == False).scalar()
    urgent = db.query(func.count(FollowUp.id)).filter(
        FollowUp.done == False,
        FollowUp.priority.in_(["critical", "urgent"])
    ).scalar()
    from datetime import date
    overdue = db.query(func.count(FollowUp.id)).filter(
        FollowUp.done == False,
        FollowUp.due_date < date.today().isoformat(),
        FollowUp.due_date != None,
    ).scalar()
    return {"total": total, "open": open_count, "urgent": urgent, "overdue": overdue}
