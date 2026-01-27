"""3-stage LLM Council orchestration (with optional Delphi Round)."""

from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass, asdict
import asyncio
import re
from collections import defaultdict

from .openrouter import query_models_parallel, query_model
from .config import COUNCIL_MODELS, CHAIRMAN_MODEL, DELPHI_MODE


# =========================
# Data model: CouncilMember
# =========================

@dataclass
class CouncilMember:
    """
    Represents a council member with identity and role.

    This object is the single source of truth for mapping anonymous response IDs
    to their originating models and governance roles.
    """
    id: str      # Anonymous identifier: A, B, C, D...
    model: str   # Full model identifier: e.g., "openai/gpt-5.2"
    role: str    # Governance role: e.g., "Regulator", "Ethics Officer"

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)

    @property
    def label(self) -> str:
        return f"Response {self.id}"

    @property
    def short_name(self) -> str:
        return self.model.split("/")[-1] if "/" in self.model else self.model


# =========================
# Governance role mapping
# =========================

# NOTE: Make sure these keys match your COUNCIL_MODELS values exactly.
# For ChatGPT and Mistral, we match any model ID containing the keyword
GOVERNANCE_ROLES = {
    "anthropic/claude-sonnet-4.5": "Ethics Officer",
    "google/gemini-3-pro-preview": "Systems Architect",
    "x-ai/grok-4": "Red Team",
}

def get_governance_role(model: str) -> str:
    """Get governance role for a model, with fallbacks for ChatGPT and Mistral variants."""
    # Check exact match first
    if model in GOVERNANCE_ROLES:
        return GOVERNANCE_ROLES[model]
    # Check if it's a ChatGPT variant (openai/chatgpt-* or openai/gpt-*)
    if "openai/" in model.lower() and ("chatgpt" in model.lower() or "gpt" in model.lower()):
        return "Systems Integrator"
    # Check if it's a Mistral variant
    if "mistral" in model.lower():
        return "Safety Engineer"
    return "Council Member"


# =========================
# Stage 1: Collect responses
# =========================

async def stage1_collect_responses(user_query: str) -> Tuple[List[Dict[str, Any]], List[CouncilMember]]:
    """
    Stage 1: Collect individual responses from all council models.
    Creates CouncilMember objects (identity mapping single source of truth).

    Returns:
      stage1_results: [{member_id, model, response}]
      council_members: [CouncilMember(...)]
    """
    # Role-aware prompts to reduce correlated failure modes.
    SAFETY_ROLES = {
        "anthropic/claude-sonnet-4.5": (
            "You are an ethical analyst focused on alignment, responsible AI behavior, and "
            "downstream impacts."
        ),
        "google/gemini-3-pro-preview": (
            "You are a systems architect optimizing for clarity, robustness, and comprehensive "
            "system design. You will also serve as the Chairman to synthesize final recommendations."
        ),
        "x-ai/grok-4": (
            "You are a critical adversarial reviewer actively searching for flaws, edge cases, and hidden risks."
        ),
    }
    
    # ChatGPT role definition (matches openai/chatgpt-* or openai/gpt-*)
    CHATGPT_ROLE = (
        "You are a Systems Integrator & Failure-Mode Analyst. Your expertise is in identifying how "
        "different components interact, where integration points fail, and what cascade failures might occur. "
        "For each analysis, provide: (1) integration risks and failure modes, (2) cross-component dependencies, "
        "(3) fault propagation paths, (4) resilience strategies, and (5) system-wide impact assessment."
    )
    
    # Mistral role definition (matches any model ID containing "mistral")
    MISTRAL_ROLE = (
        "You are a Safety Engineer focused on Shadow AI & Data Leakage prevention. "
        "Your expertise is in technical controls: AI gateways, DLP/redaction, allowlisting, "
        "logging/audit trails, and kill switches. For each recommendation, provide: "
        "(1) technical risks, (2) specific controls/guardrails, (3) evidence/logging requirements, "
        "(4) testing procedures, and (5) go/no-go recommendation with justification."
    )

    tasks = []
    for model in COUNCIL_MODELS:
        # Get role prefix - check exact match first, then ChatGPT/Mistral fallbacks
        role_prefix = SAFETY_ROLES.get(model)
        
        if not role_prefix:
            # Check for ChatGPT variants
            if "openai/" in model.lower() and ("chatgpt" in model.lower() or "gpt" in model.lower()):
                role_prefix = CHATGPT_ROLE
            # Check for Mistral variants
            elif "mistral" in model.lower():
                role_prefix = MISTRAL_ROLE
        
        content = f"{role_prefix}\n\n{user_query}" if role_prefix else user_query
        messages = [{"role": "user", "content": content}]
        tasks.append(query_model(model, messages))

    responses = await asyncio.gather(*tasks)

    council_members: List[CouncilMember] = []
    stage1_results: List[Dict[str, Any]] = []

    member_id_counter = 0
    for model, resp in zip(COUNCIL_MODELS, responses):
        if resp is None:
            continue

        member_id = chr(65 + member_id_counter)  # 'A', 'B', 'C'...
        member_id_counter += 1

        member = CouncilMember(
            id=member_id,
            model=model,
            role=get_governance_role(model),
        )
        council_members.append(member)

        stage1_results.append({
            "member_id": member.id,
            "model": model,
            "response": resp.get("content", ""),
        })

    return stage1_results, council_members


# =========================
# Stage 1.5: Delphi reflection
# =========================

async def stage1_5_delphi_reflection(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    council_members: List[CouncilMember],
) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Stage 1.5: Delphi Reflection Round (optional, enabled via DELPHI_MODE).

    Each model sees an anonymized summary of peer responses and can revise/affirm.

    Returns:
      delphi_results: [{member_id, model, round1_response, round2_response, decision, revision_reason, has_material_disagreement}]
      needs_human_review: bool
    """
    tasks = []
    for i, (member, result) in enumerate(zip(council_members, stage1_results)):
        peer_responses = [r["response"] for j, r in enumerate(stage1_results) if j != i]
        digest = _create_peer_digest(peer_responses)

        reflection_prompt = f"""You are participating in a Delphi-style governance council deliberation.

ORIGINAL QUESTION:
{user_query}

YOUR INITIAL RESPONSE (Round 1):
{result['response']}

ANONYMIZED PEER FEEDBACK:
{digest}

INSTRUCTIONS:
Based on the peer feedback above, you may either:
1) REVISE your response if you've identified gaps, errors, or better approaches
2) AFFIRM your original response if you believe it remains sound

Please provide:

DECISION: [REVISE or AFFIRM]

JUSTIFICATION (2-3 sentences):
[Explain why you chose to revise or affirm]

FINAL RESPONSE:
[Your revised response OR your affirmed original response]

If you have high-stakes disagreement, include a line:
DISSENT: <one sentence>

Be explicit about any remaining disagreements with peers. If you strongly disagree on a high-risk recommendation, state it clearly.
"""

        messages = [{"role": "user", "content": reflection_prompt}]
        tasks.append(query_model(member.model, messages, timeout=180.0))

    responses = await asyncio.gather(*tasks)

    delphi_results: List[Dict[str, Any]] = []
    material_disagreements: List[Dict[str, Any]] = []

    for member, round1, resp in zip(council_members, stage1_results, responses):
        round1_text = round1["response"]

        if resp is None:
            delphi_results.append({
                "member_id": member.id,
                "model": member.model,
                "round1_response": round1_text,
                "round2_response": round1_text,
                "decision": "AFFIRM",
                "revision_reason": "Model did not respond to reflection prompt",
                "has_material_disagreement": False,
            })
            continue

        response_text = resp.get("content", "")
        decision, justification, final_response = _parse_delphi_response(response_text)

        has_disagreement = _detect_material_disagreement(response_text)
        if has_disagreement:
            material_disagreements.append({
                "member": member.model,
                "role": member.role,
                "issue": _extract_disagreement_summary(response_text),
            })

        delphi_results.append({
            "member_id": member.id,
            "model": member.model,
            "round1_response": round1_text,
            "round2_response": final_response,
            "decision": decision,
            "revision_reason": justification,
            "has_material_disagreement": has_disagreement,
        })

    # Robust escalation signal: either explicit list or any flagged round2 response
    needs_human_review = (
        len(material_disagreements) > 0
        or any(r.get("has_material_disagreement") for r in delphi_results)
    )

    return delphi_results, needs_human_review


# =========================
# Helpers: Delphi digest + parsing
# =========================

def _create_peer_digest(peer_responses: List[str]) -> str:
    """Create an anonymized digest of peer responses."""
    if not peer_responses:
        return "No peer responses available."

    digest_parts = ["PEER RESPONSE SUMMARY:"]
    for i, response in enumerate(peer_responses, 1):
        summary = response[:220].strip()
        if len(response) > 220:
            summary += "..."
        digest_parts.append(f"• Peer {i}: {summary}")

    digest_parts.append("\nKEY THEMES:")
    all_text = " ".join(peer_responses).lower()

    if any(k in all_text for k in ["risk", "danger", "leak", "privacy", "security"]):
        digest_parts.append("• Multiple peers mention risk/safety concerns")
    if any(k in all_text for k in ["recommend", "should", "plan", "steps", "phase"]):
        digest_parts.append("• Peers provide actionable recommendations")
    if any(k in all_text for k in ["disagree", "however", "but", "trade-off", "tension"]):
        digest_parts.append("• Divergence in perspectives noted")

    return "\n".join(digest_parts)


def _parse_delphi_response(response_text: str) -> Tuple[str, str, str]:
    """Parse Delphi reflection response: (decision, justification, final_response)."""
    decision_match = re.search(r"DECISION:\s*\[?(REVISE|AFFIRM)\]?", response_text, re.IGNORECASE)
    decision = decision_match.group(1).upper() if decision_match else "AFFIRM"

    justification_match = re.search(
        r"JUSTIFICATION.*?:\s*(.*?)(?=FINAL RESPONSE:|$)",
        response_text,
        re.DOTALL | re.IGNORECASE,
    )
    justification = justification_match.group(1).strip() if justification_match else "No justification provided"

    final_response_match = re.search(
        r"FINAL RESPONSE:\s*(.*)",
        response_text,
        re.DOTALL | re.IGNORECASE,
    )
    final_response = final_response_match.group(1).strip() if final_response_match else response_text

    return decision, justification[:500], final_response


def _detect_material_disagreement(response_text: str) -> bool:
    """
    Detect if response indicates material disagreement OR high-stakes triggers,
    even without explicit dissent phrasing.
    """
    text = response_text.lower()

    explicit = [
        "strongly disagree", "fundamental disagreement", "cannot support",
        "oppose", "dangerous recommendation", "significant divergence",
        "dissent:", "high-stakes", "human decision required",
    ]

    high_risk_triggers = [
        # retroactive / forensic actions
        "forensic", "audit past", "export chat", "browser logs", "chat histories",
        "breach notification", "gdpr", "ccpa", "hipaa", "regulator",

        # extreme enforcement
        "ban all", "block all", "zero tolerance",

        # risky tech posture
        "self-host", "open-source model", "run locally", "deploy llama",
        "local model", "on-prem model",
    ]

    return any(p in text for p in explicit) or any(k in text for k in high_risk_triggers)


def _extract_disagreement_summary(response_text: str) -> str:
    """Extract a brief summary of disagreement."""
    sentences = re.split(r"[.!?]+", response_text)
    for s in sentences:
        if any(w in s.lower() for w in ["dissent", "disagree", "concern", "risk", "oppose", "forensic", "breach"]):
            return s.strip()[:220]
    return "Material disagreement detected"


# =========================
# Stage 2: Collect rankings
# =========================

async def stage2_collect_rankings(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    council_members: List[CouncilMember],
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Stage 2: Each model ranks the anonymized responses.
    Uses CouncilMember objects as the single source of truth for identity.
    """
    response_mapping: Dict[str, Dict[str, str]] = {}
    label_to_model: Dict[str, str] = {}

    for member in council_members:
        response_mapping[member.id] = {
            "model": member.model,
            "role": member.role,
            "label": member.label,
        }
        label_to_model[member.label] = member.model

    responses_text = "\n\n".join([
        f"{member.label}:\n{result['response']}"
        for member, result in zip(council_members, stage1_results)
    ])

    ranking_prompt = f"""You are evaluating different responses to the following question:

Question: {user_query}

Here are the responses from different models (anonymized):

{responses_text}

Your task:
1) Evaluate each response briefly (strengths + weaknesses).
2) Then, at the very end, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list responses from best to worst as a numbered list
- Each line must be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any extra text in the ranking section

Now provide your evaluation and ranking:"""

    messages = [{"role": "user", "content": ranking_prompt}]
    model_responses = await query_models_parallel(COUNCIL_MODELS, messages)

    stage2_results: List[Dict[str, Any]] = []
    for model, resp in model_responses.items():
        if resp is None:
            continue
        full_text = resp.get("content", "")
        parsed = parse_ranking_from_text(full_text)
        stage2_results.append({
            "model": model,
            "ranking": full_text,
            "parsed_ranking": parsed,
        })

    mapping_metadata = {
        "council_members": [m.to_dict() for m in council_members],
        "response_mapping": response_mapping,
        "label_to_model": label_to_model,
    }

    return stage2_results, mapping_metadata


# =========================
# Stage 3: Chairman synthesis
# =========================

async def stage3_synthesize_final(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    stage2_results: List[Dict[str, Any]],
    delphi_results: Optional[List[Dict[str, Any]]] = None,
    needs_human_review: bool = False,
) -> Dict[str, Any]:
    """
    Stage 3: Chairman synthesizes final response.

    In Delphi mode, uses Round 2 responses and notes human review needs.
    """
    if delphi_results:
        synthesis_text = "\n\n".join([
            f"Model: {r['model']}\n"
            f"Decision: {r.get('decision', 'N/A')}\n"
            f"Reason: {r.get('revision_reason', 'N/A')}\n"
            f"Final Response: {r.get('round2_response', '')}"
            for r in delphi_results
        ])
        mode_context = "After a Delphi reflection round where models reviewed anonymized peer feedback:"
    else:
        synthesis_text = "\n\n".join([
            f"Model: {r['model']}\nResponse: {r.get('response', '')}"
            for r in stage1_results
        ])
        mode_context = "Individual responses:"

    stage2_text = "\n\n".join([
        f"Model: {r['model']}\nRanking: {r['ranking']}"
        for r in stage2_results
    ]) if stage2_results else "No rankings available."

    chairman_prompt = f"""You are the Chairman of an AI Governance Council. Multiple AI models have deliberated on the user's question.

Original Question:
{user_query}

{mode_context}
{synthesis_text}

PEER RANKINGS:
{stage2_text}

You must produce a governance-grade output. Follow this structure exactly:

A) CONSENSUS SUMMARY (3–6 bullets)
- What do most models agree on?

B) KEY DISSENT (only if present)
- Where do models materially disagree? Preserve dissent; do NOT force consensus.
- If dissent involves legal/regulatory exposure, retroactive investigation, or blocking policies, mark it as HIGH-STAKES.

C) 30–60 DAY CONSOLIDATED PLAN (phased)
- Phase 1 (Days 1–15): immediate containment + safe-harbor rules
- Phase 2 (Days 15–30): sanctioned tools + minimal policy
- Phase 3 (Days 30–45): technical boundary controls
- Phase 4 (Days 45–60): training + monitoring + metrics
Each phase MUST include: Owner, Action, Output.

D) DECISION BOUNDARIES (when to escalate)
List clear triggers that require human leadership or counsel. At minimum include:
- handling regulated data (PII/PHI/PCI) or proprietary IP exposure,
- retroactive forensic investigation or breach-notification decisions,
- recommendations that materially increase legal or operational exposure,
- strong unresolved disagreement after Delphi Round 2.

E) KILL SWITCH / STOP CONDITIONS (fail-safe)
Define 1–2 conditions under which the organization must PAUSE rollout and activate incident response.
Include who has authority to trigger the stop and what happens next.
"""

    if needs_human_review:
        chairman_prompt += """
F) ESCALATE TO HUMAN REVIEW — HUMAN DECISION REQUIRED
State clearly: "HUMAN DECISION REQUIRED".
Describe:
1) The specific decision point.
2) 2–3 options.
3) Pros/cons + operational impact.
Use compliance-safe language: do NOT recommend "ignoring" past exposure. Instead describe proportional investigation trade-offs and advise consulting counsel where required.
"""

    chairman_prompt += "\nProvide your final synthesis now."

    messages = [{"role": "user", "content": chairman_prompt}]
    resp = await query_model(CHAIRMAN_MODEL, messages, timeout=180.0)

    if resp is None:
        return {
            "model": CHAIRMAN_MODEL,
            "response": "Error: Unable to generate final synthesis.",
            "needs_human_review": needs_human_review,
        }

    return {
        "model": CHAIRMAN_MODEL,
        "response": resp.get("content", ""),
        "needs_human_review": needs_human_review,
    }


# =========================
# Ranking parsing + aggregation
# =========================

def parse_ranking_from_text(ranking_text: str) -> List[str]:
    """Parse the FINAL RANKING section from a model's evaluation text."""
    if "FINAL RANKING:" in ranking_text:
        parts = ranking_text.split("FINAL RANKING:")
        if len(parts) >= 2:
            ranking_section = parts[1]
            numbered = re.findall(r"\d+\.\s*Response [A-Z]", ranking_section)
            if numbered:
                return [re.search(r"Response [A-Z]", m).group() for m in numbered]
            matches = re.findall(r"Response [A-Z]", ranking_section)
            return matches

    return re.findall(r"Response [A-Z]", ranking_text)


def calculate_aggregate_rankings(
    stage2_results: List[Dict[str, Any]],
    response_mapping: Dict[str, Dict[str, str]],
) -> List[Dict[str, Any]]:
    """Calculate aggregate rankings across all models (lower avg rank is better)."""
    model_positions = defaultdict(list)

    for ranking in stage2_results:
        parsed = ranking.get("parsed_ranking") or parse_ranking_from_text(ranking.get("ranking", ""))
        for position, label in enumerate(parsed, start=1):
            response_id = label.replace("Response ", "").strip()
            if response_id in response_mapping:
                model_name = response_mapping[response_id]["model"]
                model_positions[model_name].append(position)

    aggregate = []
    for model, positions in model_positions.items():
        if not positions:
            continue
        avg_rank = sum(positions) / len(positions)

        role = "Council Member"
        for resp_id, mapping in response_mapping.items():
            if mapping["model"] == model:
                role = mapping.get("role", role)
                break

        aggregate.append({
            "model": model,
            "role": role,
            "average_rank": round(avg_rank, 2),
            "rankings_count": len(positions),
        })

    aggregate.sort(key=lambda x: x["average_rank"])
    return aggregate


# =========================
# Title generation
# =========================

async def generate_conversation_title(user_query: str) -> str:
    """Generate a short title for the conversation based on the first user message."""
    title_prompt = f"""Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]
    resp = await query_model("google/gemini-2.5-flash", messages, timeout=30.0)

    if resp is None:
        return "New Conversation"

    title = resp.get("content", "New Conversation").strip().strip("\"'")
    if len(title) > 50:
        title = title[:47] + "..."
    return title


# =========================
# Full pipeline
# =========================

async def run_full_council(user_query: str) -> Tuple[List, List, Dict, Dict]:
    """
    Run the complete council process.

    If DELPHI_MODE is enabled, includes Stage 1.5 (reflection round).
    """
    stage1_results, council_members = await stage1_collect_responses(user_query)

    if not stage1_results:
        return [], [], {"model": "error", "response": "All models failed to respond. Please try again."}, {}

    delphi_results = None
    needs_human_review = False

    if DELPHI_MODE:
        delphi_results, needs_human_review = await stage1_5_delphi_reflection(
            user_query,
            stage1_results,
            council_members,
        )

    ranking_input = stage1_results
    if DELPHI_MODE and delphi_results:
        ranking_input = [
            {
                "member_id": r["member_id"],
                "model": r["model"],
                "response": r["round2_response"],
            }
            for r in delphi_results
        ]

    stage2_results, mapping_metadata = await stage2_collect_rankings(
        user_query,
        ranking_input,
        council_members,
    )

    response_mapping = mapping_metadata["response_mapping"]
    aggregate_rankings = calculate_aggregate_rankings(stage2_results, response_mapping)

    stage3_result = await stage3_synthesize_final(
        user_query,
        stage1_results,
        stage2_results,
        delphi_results=delphi_results,
        needs_human_review=needs_human_review,
    )

    metadata = {
        "council_members": mapping_metadata["council_members"],
        "response_mapping": response_mapping,
        "label_to_model": mapping_metadata.get("label_to_model", {}),
        "aggregate_rankings": aggregate_rankings,
        "delphi_mode": DELPHI_MODE,
        "delphi_results": delphi_results if DELPHI_MODE else None,
        "needs_human_review": needs_human_review,
    }

    return stage1_results, stage2_results, stage3_result, metadata
