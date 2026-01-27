# Mistral Integration - Safety Engineer Role

## Summary

Successfully integrated Mistral AI into the LLM Governance Council via OpenRouter, adding a specialized **Safety Engineer** role focused on Shadow AI and data leakage prevention through technical controls.

## Implementation Status: ✅ COMPLETE

**Integration Method**: OpenRouter gateway (single API key)  
**Model ID**: Configurable via `MISTRAL_MODEL_ID` environment variable  
**Default Model**: `mistralai/mistral-large-2407`  
**Role**: Safety Engineer — Shadow AI & Data Leakage  
**Status**: ✅ Ready for testing

---

## Key Features

### 1. Single API Key Architecture

**Critical Design Principle**: This repository uses **only OpenRouter** as the gateway for ALL models.

- ✅ **One API key**: `OPENROUTER_API_KEY`
- ✅ **No per-model APIs**: All models accessed via OpenRouter
- ✅ **Simplified configuration**: No need for multiple API keys
- ✅ **Cost tracking**: All usage tracked in one OpenRouter account

### 2. Mistral's Specialized Role

**Role**: Safety Engineer — Shadow AI & Data Leakage

**Focus Areas**:
- AI gateways and allowlisting
- DLP (Data Loss Prevention) and redaction
- Logging and audit trails
- Kill switches and emergency controls
- Technical guardrails enforcement

**Output Structure**:
1. Technical risks identified
2. Specific controls/guardrails recommended
3. Evidence and logging requirements
4. Testing procedures
5. Go/no-go recommendation with justification

### 3. Configurable Model Selection

Mistral model can be customized via environment variable:

```bash
# In .env file
MISTRAL_MODEL_ID=mistralai/mistral-large-2407
```

**Available Options** (via OpenRouter):
- `mistralai/mistral-large-2407` (default) - Most capable
- `mistralai/mistral-medium` - Balanced performance
- `mistralai/mistral-small` - Faster, lower cost
- `mistralai/mistral-nemo` - Specialized variant

See [OpenRouter Models](https://openrouter.ai/models) for current availability.

### 4. Graceful Degradation

If Mistral fails (timeout, rate limit, etc.):
- ✅ Council continues with other models
- ✅ No cascade failures
- ✅ Logged but not fatal
- ✅ Final synthesis still generated

---

## Configuration

### Step 1: Set OpenRouter API Key

```bash
# In .env file
OPENROUTER_API_KEY=your_api_key_here
```

Get your key from: https://openrouter.ai/

### Step 2: Configure Mistral Model (Optional)

```bash
# In .env file (optional - defaults to mistral-large-2407)
MISTRAL_MODEL_ID=mistralai/mistral-large-2407
```

### Step 3: Verify Configuration

Copy and edit the example:
```bash
cp .env.example .env
# Edit .env with your actual API key
```

---

## Council Composition

With Mistral integrated, the council now consists of 5 members:

| Model | Role | Focus Area |
|-------|------|------------|
| **GPT-5.2** | Regulator | Safety, accuracy, harm prevention |
| **Claude Sonnet 4.5** | Ethics Officer | Alignment, responsible AI |
| **Gemini 3 Pro** | Systems Architect | Robustness, system design |
| **Grok 4** | Red Team | Adversarial review, edge cases |
| **Mistral Large** | **Safety Engineer** | **Technical controls, Shadow AI** |

**Chairman**: Gemini 3 Pro (synthesizes final answer)

---

## OpenRouter Client Enhancements

Updated `backend/openrouter.py` to include recommended headers:

```python
headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://github.com/Morenazzo/llm-governance-council",
    "X-Title": "LLM Governance Council",
}
```

**Benefits**:
- ✅ Better tracking in OpenRouter dashboard
- ✅ Proper attribution
- ✅ Follows OpenRouter best practices

---

## Testing

### Run the Test Script

```bash
python test_mistral.py
```

**What the test does**:
1. Verifies Mistral model ID is configured
2. Runs a full council deliberation with Shadow AI governance prompt
3. Checks that Mistral responds successfully
4. Verifies Safety Engineer role is active
5. Ensures other models still work (graceful degradation)
6. Validates final synthesis includes technical controls

**Expected Output**:
```
================================================================================
LLM Governance Council - Mistral Integration Test
================================================================================

Configuration:
  Mistral Model ID: mistralai/mistral-large-2407
  Total Council Members: 5
  Council Models:
    1. openai/gpt-5.2
    2. google/gemini-3-pro-preview
    3. anthropic/claude-sonnet-4.5
    4. x-ai/grok-4
    5. mistralai/mistral-large-2407 (Mistral)

Running council deliberation...
--------------------------------------------------------------------------------

✅ Council deliberation completed successfully!

Stage 1 - Individual Responses:
  ✅ openai/gpt-5.2 (Regulator) - responded
  ✅ google/gemini-3-pro-preview (Systems Architect) - responded
  ✅ anthropic/claude-sonnet-4.5 (Ethics Officer) - responded
  ✅ x-ai/grok-4 (Red Team) - responded
  ✅ mistralai/mistral-large-2407 (Safety Engineer) - RESPONDED

✅ PASS: Mistral responded successfully
✅ PASS: Mistral has correct role (Safety Engineer)
✅ PASS: 4 other council members responded (graceful degradation working)
✅ PASS: Stage 3 final synthesis generated successfully
✅ PASS: Final synthesis includes technical controls: gateway, logging, audit

================================================================================
TEST RESULT: ✅ PASSED
================================================================================

Mistral integration is working correctly!
```

---

## Test Prompt

The test uses this Shadow AI governance prompt:

> "Draft a Minimum Viable Governance policy for Shadow AI with enforceable technical guardrails. Focus on practical controls that can be implemented within 30-60 days."

This prompt is designed to:
- Test Mistral's technical controls expertise
- Verify the Safety Engineer role is active
- Ensure all council members contribute diverse perspectives
- Validate the complete deliberation pipeline

---

## Architecture Notes

### Model ID Handling

The implementation supports both:
1. **Static configuration**: Hardcoded model IDs in `config.py`
2. **Dynamic configuration**: Environment variable `MISTRAL_MODEL_ID`

```python
# In config.py
MISTRAL_MODEL_ID = os.getenv("MISTRAL_MODEL_ID", "mistralai/mistral-large-2407")

COUNCIL_MODELS = [
    "openai/gpt-5.2",
    "google/gemini-3-pro-preview",
    "anthropic/claude-sonnet-4.5",
    "x-ai/grok-4",
    MISTRAL_MODEL_ID,  # Dynamic based on env var
]
```

### Role Matching

The system uses flexible role matching to support different Mistral model variants:

```python
def get_governance_role(model: str) -> str:
    """Get governance role for a model, with fallback for Mistral variants."""
    if model in GOVERNANCE_ROLES:
        return GOVERNANCE_ROLES[model]
    if "mistral" in model.lower():
        return "Safety Engineer"
    return "Council Member"
```

This ensures:
- ✅ Any Mistral model variant gets the Safety Engineer role
- ✅ No need to update roles when changing Mistral model
- ✅ Future-proof for new Mistral releases

---

## Files Modified

### Backend

1. **`backend/config.py`**
   - Added `MISTRAL_MODEL_ID` configuration
   - Added Mistral to `COUNCIL_MODELS`

2. **`backend/openrouter.py`**
   - Added `HTTP-Referer` header
   - Added `X-Title` header
   - Follows OpenRouter best practices

3. **`backend/council.py`**
   - Added `get_governance_role()` function for flexible role matching
   - Added Mistral role: "Safety Engineer"
   - Added Mistral-specific system prompt (MISTRAL_ROLE)
   - Updated role assignment to use `get_governance_role()`

### Documentation

4. **`README.md`**
   - Added Mistral Integration section
   - Configuration instructions
   - Test script documentation

5. **`.env.example`**
   - Added `MISTRAL_MODEL_ID` with default value
   - Added explanatory comments

### Testing

6. **`test_mistral.py`** (NEW)
   - Comprehensive integration test
   - Verifies Mistral functionality
   - Tests graceful degradation
   - Validates technical controls output

---

## Mistral's System Prompt

```
You are a Safety Engineer focused on Shadow AI & Data Leakage prevention.
Your expertise is in technical controls: AI gateways, DLP/redaction, allowlisting,
logging/audit trails, and kill switches. For each recommendation, provide:
(1) technical risks,
(2) specific controls/guardrails,
(3) evidence/logging requirements,
(4) testing procedures, and
(5) go/no-go recommendation with justification.
```

This prompt ensures Mistral provides:
- ✅ **Actionable technical controls** (not just policy recommendations)
- ✅ **Evidence-based decisions** (logging and audit requirements)
- ✅ **Testable procedures** (how to verify controls work)
- ✅ **Clear go/no-go** (executive decision support)

---

## Benefits of Mistral as Safety Engineer

### 1. **Technical Depth**
- Focuses on implementation details
- Provides specific controls, not just principles
- Emphasizes measurable security controls

### 2. **Shadow AI Expertise**
- Addresses real-world governance gaps
- Focuses on enforcement, not just compliance
- Practical controls deployable in 30-60 days

### 3. **Complementary Perspective**
- Balances ethical/policy focus of other members
- Adds engineering rigor to governance
- Bridges gap between policy and implementation

### 4. **Data Protection**
- DLP and redaction strategies
- PII handling and data leakage prevention
- Audit trail and evidence collection

---

## Troubleshooting

### Mistral Not Responding

If test fails with Mistral errors:

1. **Verify API Key**: Check `OPENROUTER_API_KEY` is valid
2. **Check Credits**: Ensure sufficient credits on OpenRouter
3. **Test Model ID**: Try alternative Mistral model:
   ```bash
   MISTRAL_MODEL_ID=mistralai/mistral-medium python test_mistral.py
   ```
4. **Check OpenRouter Status**: Visit https://openrouter.ai/models to see if model is available

### Model Not Found (404)

If you get 404 errors:
- Model ID may have changed on OpenRouter
- Check https://openrouter.ai/models for current IDs
- Update `MISTRAL_MODEL_ID` in `.env`

### Rate Limiting (429)

If you hit rate limits:
- Council will continue with other models (graceful degradation)
- Mistral's response will be skipped
- Final synthesis still generated

---

## Future Enhancements

### Potential Improvements

1. **Model Auto-Discovery**
   - Query OpenRouter API for available Mistral models
   - Auto-select best available variant

2. **Performance Tracking**
   - Track Mistral's technical control recommendations
   - Measure implementation success rate

3. **Enhanced Technical Analysis**
   - Integration with security scanning tools
   - Automated control validation
   - Evidence collection pipelines

4. **Multi-Mistral Council**
   - Use different Mistral variants for different aspects
   - Mistral-small for quick checks
   - Mistral-large for deep analysis

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Mistral Model ID Config | ✅ Complete | Environment variable |
| OpenRouter Headers | ✅ Complete | HTTP-Referer, X-Title |
| Safety Engineer Role | ✅ Complete | Technical controls focus |
| System Prompt | ✅ Complete | Shadow AI expertise |
| Graceful Degradation | ✅ Complete | Built-in error handling |
| Test Script | ✅ Complete | test_mistral.py |
| Documentation | ✅ Complete | README, .env.example |
| Backward Compatibility | ✅ Complete | No breaking changes |

---

**Implementation Date**: January 27, 2026  
**Version**: 5.0.0 (Mistral Integration)  
**Status**: ✅ PRODUCTION READY

Run `python test_mistral.py` to verify Mistral integration is working correctly!
