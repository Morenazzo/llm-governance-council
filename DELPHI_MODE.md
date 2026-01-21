# Delphi Mode - Iterative Reflection Feature

## Summary

Successfully implemented a Delphi-inspired deliberation mode that adds an iterative reflection round (Stage 1.5) where council members can revise their responses after seeing anonymized peer feedback. This feature includes automatic escalation to human review when material disagreements persist.

## Implementation Status: ✅ COMPLETE

**Backend**: ✅ Running on port 8001  
**Frontend**: ✅ Hot-reloaded and active  
**Feature**: ✅ Toggleable via DELPHI_MODE flag  
**Default Behavior**: ✅ Preserved (Delphi mode disabled by default)

---

## What is Delphi Mode?

The Delphi Method is a structured communication technique originally developed as a systematic, interactive forecasting method which relies on a panel of experts. In our implementation:

1. **Round 1 (Stage 1)**: Each model provides independent initial response
2. **Reflection (Stage 1.5)**: Each model sees anonymized peer feedback and can:
   - REVISE their response if they identify gaps or better approaches
   - AFFIRM their original response if they believe it remains sound
3. **Final Synthesis (Stage 3)**: Uses Round 2 responses and escalates to human if needed

---

## How to Enable

### Via Environment Variable

Add to your `.env` file:
```bash
DELPHI_MODE=true
```

Or run with environment variable:
```bash
DELPHI_MODE=true uv run python -m backend.main
```

### Default Behavior

By default, `DELPHI_MODE=false` and the system behaves exactly as before:
- Stage 1: Individual responses
- Stage 2: Peer rankings  
- Stage 3: Final synthesis

---

## Architecture

### Stage Flow

```
┌─────────────────────────────────────────────────────────┐
│ Stage 1: Individual Responses (Round 1)                 │
│ - Each model provides independent initial response      │
│ - CouncilMember objects created                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├─ DELPHI_MODE = false ─┐
                  │                        │
                  ├─ DELPHI_MODE = true ───▼
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Stage 1.5: Delphi Reflection (Round 2) [OPTIONAL]      │
│ - Models see anonymized peer digest                     │
│ - Can REVISE or AFFIRM                                   │
│ - Provide justification                                  │
│ - Material disagreements detected                        │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Stage 2: Peer Rankings                                   │
│ - Ranks Round 2 responses (Delphi) or Round 1 (standard)│
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Stage 3: Final Synthesis                                 │
│ - Uses Round 2 (Delphi) or Round 1 (standard)          │
│ - Escalates to human if needs_human_review = true       │
└─────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Anonymized Peer Digest

Each model receives a structured digest of peer responses:

```
PEER RESPONSE SUMMARY:
• Peer 1: [First 200 chars of response]...
• Peer 2: [First 200 chars of response]...
• Peer 3: [First 200 chars of response]...

KEY THEMES:
• Multiple peers mention risk/safety concerns
• Peers provide specific recommendations
• Some divergence in perspectives noted
```

**Key Points:**
- ✅ No model names revealed during deliberation
- ✅ Preserves anonymity and prevents bias
- ✅ Highlights common themes automatically

### 2. Revision Decision

Each model must choose:

**REVISE**: Update response based on peer feedback
```
DECISION: REVISE
JUSTIFICATION: After reviewing peer feedback, I identified a critical 
gap in my original response regarding data retention policies...
FINAL RESPONSE: [Revised response incorporating peer insights]
```

**AFFIRM**: Keep original response
```
DECISION: AFFIRM
JUSTIFICATION: My original response remains sound. While peers raised 
good points, they align with my recommendations...
FINAL RESPONSE: [Original response maintained]
```

### 3. Material Disagreement Detection

The system automatically detects when a model has serious concerns:

**Indicators:**
- "strongly disagree"
- "fundamental disagreement"
- "critical concern"
- "major risk"
- "cannot support"
- "oppose this"
- "dangerous recommendation"

**Action:** Sets `needs_human_review = true`

### 4. Human Review Escalation

When material disagreements persist after Round 2:

**Stage 1.5 UI Shows:**
```
⚠️ Human Review Needed
Material Disagreements Detected

One or more council members have identified significant concerns 
that require human judgment.
```

**Stage 3 UI Shows:**
```
🚨 Human Decision Required

⚠️ Material Disagreements Require Your Judgment
The council has identified significant divergence on high-risk 
recommendations. Please review the options below and make the 
final decision.
```

**Chairman's Synthesis Includes:**
1. Clear statement: "HUMAN DECISION REQUIRED"
2. What specifically needs human judgment
3. 2-3 distinct options for the human to choose from
4. Pros/cons of each option

---

## Data Structure

### Stage 1.5 Output (Delphi Results)

```json
[
  {
    "member_id": "A",
    "model": "openai/gpt-5.2",
    "round1_response": "Initial response...",
    "round2_response": "Revised response...",
    "decision": "REVISE",
    "revision_reason": "After reviewing peer feedback...",
    "has_material_disagreement": false
  },
  {
    "member_id": "B",
    "model": "anthropic/claude-sonnet-4.5",
    "round1_response": "Initial response...",
    "round2_response": "Initial response...",
    "decision": "AFFIRM",
    "revision_reason": "My original response remains sound...",
    "has_material_disagreement": true
  }
]
```

### Stage 3 Output (with Human Review)

```json
{
  "model": "google/gemini-3-pro-preview",
  "response": "The council synthesis...",
  "needs_human_review": true
}
```

---

## Frontend Components

### New Component: Stage1_5.jsx

Displays the Delphi reflection round with:

**Features:**
- Tab interface for each model
- Decision badge (REVISE/AFFIRM)
- Revision justification display
- Side-by-side Round 1 vs Round 2 responses
- Material disagreement alerts
- Human review badge when needed

**Styling:**
- Purple theme (#8b7fc7) to distinguish from other stages
- Red alerts for disagreements
- Color-coded decision badges

### Updated Components

**ChatInterface.jsx:**
- Added Stage 1.5 loading indicator
- Displays Stage1_5 component
- Passes `needs_human_review` to Stage 3

**Stage3.jsx:**
- Shows human decision badge if needed
- Displays escalation alert
- Pulsing animation on badge

---

## API Events

### New Streaming Events

**stage1_5_start:**
```json
{"type": "stage1_5_start"}
```

**stage1_5_complete:**
```json
{
  "type": "stage1_5_complete",
  "data": [...delphi_results...],
  "metadata": {
    "needs_human_review": true
  }
}
```

---

## Use Cases

### When to Use Delphi Mode

✅ **High-stakes decisions** where iteration improves quality  
✅ **Complex governance questions** requiring multiple perspectives  
✅ **Risk assessment** where dissent should be preserved  
✅ **Policy development** benefiting from iterative refinement  
✅ **Controversial topics** where disagreement is valuable

### When NOT to Use Delphi Mode

❌ Simple factual questions  
❌ Time-sensitive queries needing quick responses  
❌ Low-risk decisions where iteration adds minimal value  
❌ Questions with clear consensus expected

---

## Benefits of Delphi Mode

### 1. **Improved Quality**
- Models can learn from each other without bias
- Gaps identified and filled in Round 2
- More comprehensive final responses

### 2. **Preserved Dissent**
- Doesn't force consensus
- Models can maintain disagreement
- Valuable diverse perspectives retained

### 3. **Human Escalation**
- Automatic detection of material disagreements
- Clear options provided for human decision
- Explicit accountability for high-risk choices

### 4. **Transparency**
- Full audit trail (Round 1 → Round 2)
- Justifications for revisions visible
- Clear reasoning for escalations

### 5. **Backward Compatible**
- Disabled by default
- No breaking changes to existing code
- Easy to toggle on/off

---

## Implementation Details

### Backend Functions

**`stage1_5_delphi_reflection()`**
- Creates anonymized peer digests
- Sends reflection prompts to each model
- Parses REVISE/AFFIRM decisions
- Detects material disagreements
- Returns (delphi_results, needs_human_review)

**Helper Functions:**
- `_create_peer_digest()`: Anonymizes peer responses
- `_parse_delphi_response()`: Extracts decision and justification
- `_detect_material_disagreement()`: Identifies escalation triggers
- `_extract_disagreement_summary()`: Summarizes the issue

**Updated Functions:**
- `stage3_synthesize_final()`: Handles Delphi mode and escalation
- `run_full_council()`: Conditionally runs Stage 1.5

### Configuration

**`backend/config.py`:**
```python
DELPHI_MODE = os.getenv("DELPHI_MODE", "false").lower() == "true"
```

---

## Examples

### Example: Standard Mode (DELPHI_MODE=false)

```
Stage 1: Individual Responses
  → gpt-5.2: "I recommend..."
  → claude-sonnet-4.5: "My analysis suggests..."

Stage 2: Peer Rankings
  → Rankings based on Round 1 responses

Stage 3: Final Synthesis
  → Chairman synthesizes from Round 1
```

### Example: Delphi Mode (DELPHI_MODE=true)

```
Stage 1: Individual Responses (Round 1)
  → gpt-5.2: "I recommend approach A..."
  → claude-sonnet-4.5: "My analysis suggests approach B..."

Stage 1.5: Delphi Reflection (Round 2)
  → gpt-5.2: REVISE - "After peer feedback, I now recommend..."
  → claude-sonnet-4.5: AFFIRM - "I maintain my position because..."
  → ⚠️ Material disagreement detected

Stage 2: Peer Rankings
  → Rankings based on Round 2 responses

Stage 3: Final Synthesis
  → 🚨 HUMAN DECISION REQUIRED
  → Chairman presents options A vs B with pros/cons
```

---

## Testing

### Manually Test Delphi Mode

1. **Enable Delphi Mode:**
   ```bash
   echo "DELPHI_MODE=true" >> .env
   ```

2. **Restart Backend:**
   ```bash
   # Backend will reload with Delphi mode enabled
   ```

3. **Reload Frontend:**
   - Navigate to http://localhost:5173
   - Start a new conversation

4. **Submit a Query:**
   - Ask a question likely to generate diverse perspectives
   - Example: "Should we ban AI tools or create safe harbor policies?"

5. **Observe:**
   - Stage 1: Individual responses
   - Stage 1.5: Reflection round appears with purple theme
   - Check for REVISE vs AFFIRM decisions
   - Look for material disagreement alerts
   - Stage 3: Check for human review escalation

### Disable Delphi Mode

```bash
# In .env file
DELPHI_MODE=false
```

Or remove the line entirely (defaults to false)

---

## Files Modified

### Backend

1. **`backend/config.py`**
   - Added `DELPHI_MODE` configuration flag

2. **`backend/council.py`**
   - Added `stage1_5_delphi_reflection()` function
   - Added helper functions for peer digests and disagreement detection
   - Updated `stage3_synthesize_final()` to handle Delphi mode
   - Updated `run_full_council()` to conditionally run Stage 1.5

3. **`backend/main.py`**
   - Updated streaming endpoint to handle Stage 1.5 events
   - Added `stage1_5_start` and `stage1_5_complete` events

### Frontend

4. **`frontend/src/components/Stage1_5.jsx`** (NEW)
   - Complete component for displaying Delphi reflection
   - Tab interface, decision badges, Round 1/2 comparison

5. **`frontend/src/components/Stage1_5.css`** (NEW)
   - Purple theme styling
   - Alert styling for disagreements and human review

6. **`frontend/src/components/ChatInterface.jsx`**
   - Imported Stage1_5 component
   - Added Stage 1.5 loading state
   - Displays Stage1_5 when data available

7. **`frontend/src/components/ChatInterface.css`**
   - Added `.delphi-loading` style variant

8. **`frontend/src/components/Stage3.jsx`**
   - Added human review badge and alert
   - Conditional rendering based on `needs_human_review`

9. **`frontend/src/components/Stage3.css`**
   - Added human decision badge with pulsing animation
   - Alert styling for escalation

10. **`frontend/src/App.jsx`**
    - Added `stage1_5` and `loading.stage1_5` to message structure
    - Added event handlers for `stage1_5_start` and `stage1_5_complete`

---

## Future Enhancements

### Potential Improvements

1. **Configurable Reflection Depth**
   - Allow multiple reflection rounds (Round 3, 4, etc.)
   - Configurable via `DELPHI_ROUNDS=2`

2. **Custom Disagreement Thresholds**
   - Allow users to define when escalation triggers
   - Risk-based escalation rules

3. **Peer Digest Customization**
   - More sophisticated summarization
   - AI-powered theme extraction
   - Configurable digest length

4. **Human Decision Workflow**
   - Interactive UI for human to make decision
   - Record and track human decisions
   - Analytics on human intervention frequency

5. **Delphi Analytics**
   - Track revision rates per model
   - Measure consensus convergence
   - Identify persistent disagreers

6. **Selective Delphi**
   - Enable for specific query types only
   - Risk-based automatic enabling
   - User toggle in UI

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Configuration Flag | ✅ Complete | DELPHI_MODE in config.py |
| Stage 1.5 Logic | ✅ Complete | Full Delphi reflection implementation |
| Peer Digest | ✅ Complete | Anonymized summaries working |
| Disagreement Detection | ✅ Complete | Automatic escalation triggers |
| Human Review Escalation | ✅ Complete | UI alerts and badges |
| Frontend Components | ✅ Complete | Stage1_5.jsx with full UI |
| Streaming Events | ✅ Complete | stage1_5_start/complete |
| Backward Compatibility | ✅ Complete | Default behavior preserved |
| Backend Running | ✅ Active | Port 8001 |
| Frontend Running | ✅ Active | Port 5173 |
| Linter | ✅ Clean | No errors |

---

## Quick Start

### Enable Delphi Mode

```bash
# Add to .env
echo "DELPHI_MODE=true" >> .env

# Restart backend (auto-reload if using dev server)

# Test with a question
curl -X POST http://localhost:8001/api/conversations/[id]/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Should we implement strict AI governance?"}'
```

### Check Stage 1.5 in UI

1. Open http://localhost:5173
2. Create new conversation
3. Ask a governance question
4. Watch for Stage 1.5 (purple theme) between Stage 1 and Stage 2
5. Review REVISE/AFFIRM decisions
6. Check for human review alerts if disagreements exist

---

**Implementation Date**: January 21, 2026  
**Version**: 4.0.0 (Delphi Mode)  
**Status**: ✅ PRODUCTION READY

**Delphi Mode brings iterative deliberation and intelligent escalation to the AI Governance Council!** 🎯
