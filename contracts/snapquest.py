# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

import json
import typing
from dataclasses import dataclass
from datetime import datetime, timezone

# Error classification prefixes
ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"
ERROR_TRANSIENT = "[TRANSIENT]"
ERROR_LLM = "[LLM_ERROR]"

@allow_storage
@dataclass
class Quest:
    quest_master: Address
    title: str
    prompt: str              # The scavenger hunt objective
    bounty_amount: u256      # Payout per successful hunter
    escrow_balance: u256
    payouts_made: u256
    active: bool
    created_at: str

@allow_storage
@dataclass
class Submission:
    quest_id: u256
    hunter: Address
    photo_url: str
    status: str              # "approved" | "rejected"
    score: u256              
    reason: str              
    paid_amount: u256        
    created_at: str

# Native EOA GenVM Transfer Wrapper
@gl.evm.contract_interface
class _Payee:
    class View:
        pass
    class Write:
        pass

def _coerce_json(raw: typing.Any) -> dict:
    if isinstance(raw, dict):
        return raw
    if not isinstance(raw, str):
        raise gl.vm.UserError(f"{ERROR_LLM} model returned {type(raw).__name__}")
    text = raw.strip()
    first = text.find("{")
    last = text.rfind("}")
    if first == -1 or last == -1 or last < first:
        raise gl.vm.UserError(f"{ERROR_LLM} no JSON object in model output")
    try:
        return json.loads(text[first : last + 1])
    except (ValueError, TypeError):
        raise gl.vm.UserError(f"{ERROR_LLM} unparseable JSON in model output")

def _as_bool(value: typing.Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in ("true", "yes", "1", "pass", "approved")
    return False

def _as_score(value: typing.Any) -> int:
    try:
        n = int(round(float(str(value).strip())))
    except (ValueError, TypeError):
        return 0
    return max(0, min(100, n))

def _hex(addr: typing.Any) -> str:
    if hasattr(addr, "as_hex"):
        return addr.as_hex
    return Address(addr).as_hex

def _handle_leader_error(leaders_res: gl.vm.Result, leader_fn) -> bool:
    leader_msg = getattr(leaders_res, "message", "")
    try:
        leader_fn()
        return False
    except gl.vm.UserError as e:
        validator_msg = getattr(e, "message", None) or str(e)
        if validator_msg.startswith(ERROR_EXPECTED) or validator_msg.startswith(ERROR_EXTERNAL):
            return validator_msg == leader_msg
        
        # If both hit a transient or LLM error, agree to fail cleanly
        is_val_trans = validator_msg.startswith(ERROR_TRANSIENT) or validator_msg.startswith(ERROR_LLM)
        is_lead_trans = leader_msg.startswith(ERROR_TRANSIENT) or leader_msg.startswith(ERROR_LLM)
        if is_val_trans and is_lead_trans:
            return True
            
        return False
    except Exception:
        return False

class SnapQuest(gl.Contract):
    owner: Address
    fee_recipient: Address
    protocol_fee_bps: u256

    quest_count: u256
    quests: TreeMap[u256, Quest]

    submission_count: u256
    submissions: TreeMap[u256, Submission]

    # One approved payout per hunter per quest
    claimed: TreeMap[str, bool]

    def __init__(self) -> None:
        self.owner = gl.message.sender_address
        self.fee_recipient = gl.message.sender_address
        self.protocol_fee_bps = u256(500) # 5% fee
        self.quest_count = u256(0)
        self.submission_count = u256(0)

    @gl.public.write.payable
    def create_quest(self, title: str, prompt: str, bounty_amount: u256) -> u256:
        deposit = gl.message.value
        if bounty_amount == u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} bounty_amount must be > 0")
        if deposit < bounty_amount:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} deposit must cover at least one bounty")
        if len(prompt.strip()) == 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} prompt must not be empty")

        q_id = self.quest_count
        self.quests[q_id] = Quest(
            quest_master=gl.message.sender_address,
            title=title,
            prompt=prompt,
            bounty_amount=bounty_amount,
            escrow_balance=deposit,
            payouts_made=u256(0),
            active=True,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self.quest_count = q_id + u256(1)
        return q_id

    @gl.public.write
    def close_quest(self, quest_id: u256) -> None:
        quest = self._require_quest(quest_id)
        if gl.message.sender_address != quest.quest_master:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} only the quest master can close")
        if not quest.active:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} quest already closed")

        refund = quest.escrow_balance
        quest.escrow_balance = u256(0)
        quest.active = False
        if refund > u256(0):
            _Payee(quest.quest_master).emit_transfer(value=refund)

    @gl.public.write
    def submit_photo(self, quest_id: u256, photo_url: str) -> str:
        quest = self._require_quest(quest_id)
        if not quest.active:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} quest is not active")
        if quest.escrow_balance < quest.bounty_amount:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} quest escrow is empty")

        hunter = gl.message.sender_address
        claim_key = f"{int(quest_id)}:{_hex(hunter)}"
        if self.claimed.get(claim_key, False):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} you have already claimed this bounty")
        if len(photo_url.strip()) == 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} photo_url must not be empty")

        verdict = self._evaluate_photo(photo_url, quest.prompt)
        compliant = _as_bool(verdict.get("compliant"))
        score = u256(_as_score(verdict.get("score")))
        reason = str(verdict.get("reason", ""))[:512]

        sub_id = self.submission_count
        self.submission_count = sub_id + u256(1)

        if not compliant:
            self.submissions[sub_id] = Submission(
                quest_id=quest_id,
                hunter=hunter,
                photo_url=photo_url,
                status="rejected",
                score=score,
                reason=reason,
                paid_amount=u256(0),
                created_at=datetime.now(timezone.utc).isoformat(),
            )
            return "rejected"

        # Approved Payout
        bounty = quest.bounty_amount
        fee = (bounty * self.protocol_fee_bps) // u256(10000)
        net = bounty - fee

        quest.escrow_balance = quest.escrow_balance - bounty
        quest.payouts_made = quest.payouts_made + u256(1)
        self.claimed[claim_key] = True

        self.submissions[sub_id] = Submission(
            quest_id=quest_id,
            hunter=hunter,
            photo_url=photo_url,
            status="approved",
            score=score,
            reason=reason,
            paid_amount=net,
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        _Payee(hunter).emit_transfer(value=net)
        if fee > u256(0):
            _Payee(self.fee_recipient).emit_transfer(value=fee)

        return "approved"

    def _evaluate_photo(self, photo_url: str, prompt_text: str) -> dict:
        prompt = (
            "You are a strict judge for a global Scavenger Hunt game.\n"
            "Analyze ONLY the attached photo against the objective prompt below.\n\n"
            f"OBJECTIVE:\n{prompt_text}\n\n"
            "Decide whether the photo perfectly satisfies the objective. "
            "If the requested object or scene is missing, it is NOT compliant.\n"
            "CRITICAL: You MUST respond ONLY with a valid JSON object. Do NOT include markdown formatting, backticks, or conversational text.\n"
            'Format: {"compliant": true|false, "score": <integer 0-100>, "reason": "<one sentence>"}'
        )

        def leader_fn() -> dict:
            resp = gl.nondet.web.get(photo_url)
            status = getattr(resp, "status", None)
            if status is None:
                status = getattr(resp, "status_code", 200)
            if 400 <= int(status) < 500:
                raise gl.vm.UserError(f"{ERROR_EXTERNAL} photo fetch returned {int(status)}")
            if int(status) >= 500:
                raise gl.vm.UserError(f"{ERROR_TRANSIENT} photo host unavailable ({int(status)})")

            image_bytes = resp.body
            raw = gl.nondet.exec_prompt(prompt, images=[image_bytes], response_format="json")
            data = _coerce_json(raw)
            return {
                "compliant": _as_bool(data.get("compliant")),
                "score": _as_score(data.get("score")),
                "reason": str(data.get("reason", ""))[:512],
            }

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return _handle_leader_error(leaders_res, leader_fn)
            mine = leader_fn()
            leader = leaders_res.calldata
            return bool(mine["compliant"]) == bool(leader["compliant"])

        return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

    @gl.public.view
    def get_quest(self, quest_id: u256) -> dict:
        q = self._require_quest(quest_id)
        return {
            "id": int(quest_id),
            "quest_master": _hex(q.quest_master),
            "title": q.title,
            "prompt": q.prompt,
            "bounty_amount": str(int(q.bounty_amount)),
            "escrow_balance": str(int(q.escrow_balance)),
            "payouts_made": int(q.payouts_made),
            "active": bool(q.active),
            "created_at": q.created_at,
        }

    @gl.public.view
    def get_quest_count(self) -> int:
        return int(self.quest_count)
        
    @gl.public.view
    def get_submission(self, sub_id: u256) -> dict:
        if sub_id not in self.submissions:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} submission not found")
        s = self.submissions[sub_id]
        return {
            "id": int(sub_id),
            "quest_id": int(s.quest_id),
            "hunter": _hex(s.hunter),
            "photo_url": s.photo_url,
            "status": s.status,
            "score": int(s.score),
            "reason": s.reason,
            "paid_amount": str(int(s.paid_amount)),
            "created_at": s.created_at,
        }

    @gl.public.view
    def get_submission_count(self) -> int:
        return int(self.submission_count)

    def _require_quest(self, quest_id: u256) -> Quest:
        if quest_id not in self.quests:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} quest not found")
        return self.quests[quest_id]
