from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from sqlmodel import Session

from app.db.models import Operation, User


def analyze_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Scaffold logic: a deterministic summary the frontend can rely on.
    op_type = payload.get("op_type") or payload.get("operationType") or "unknown"
    scan = payload.get("scan") or payload.get("result") or {}

    issues = []
    if isinstance(scan, dict):
        if scan.get("status") == "weak_signal":
            issues.append("signal faible")
        if scan.get("protocol") == "unknown":
            issues.append("protocole non identifié")
        if scan.get("emulated") is True:
            issues.append("simulation/emulation")

    return {
        "opType": op_type,
        "summary": f"Analyse (scaffold) pour {op_type}.",
        "keyFindings": issues[:3] if issues else ["aucun indicateur majeur"],
        "recommendedActions": [
            "vérifier l'autorisation",
            "enregistrer le résultat dans la bibliothèque",
            "générer un rapport",
        ],
    }


def run_ai_analysis(
    session: Session,
    user: User,
    *,
    payload: Dict[str, Any],
) -> Operation:
    analysis = analyze_payload(payload)
    op = Operation(
        user_id=user.id,  # type: ignore[arg-type]
        op_type="ai.analyze",
        scope_required="ai:analyze",
        status="done",
        payload=payload,
        result=analysis,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(op)
    session.commit()
    session.refresh(op)
    return op

