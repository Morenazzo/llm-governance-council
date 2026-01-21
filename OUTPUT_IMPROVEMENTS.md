# LLM Council Output Logic Improvements

## Summary

The Stage 2 output has been restructured to clearly distinguish between internal anonymized deliberation and final labeled outputs, improving semantic clarity and usefulness.

## Changes Implemented

### 1. Three Distinct Output Sections

Each Stage 2 evaluation now displays three separate sections with clear purposes:

#### 🔍 Internal Deliberation (Anonymized)
- **Purpose**: Show the raw reasoning process exactly as the model saw it
- **Content**: Evaluation text using anonymous labels (Response A, B, C, D)
- **Why**: Demonstrates that bias prevention worked during deliberation
- **Example**: "Response A provides comprehensive coverage but lacks depth on edge cases..."

#### 🏆 Final Ranking (De-anonymized)
- **Purpose**: Human-readable mapping showing which model earned each rank
- **Content**: Ordered list with both model names and original anonymous labels
- **Format**: `1. gpt-5.2 (Response A)`
- **Why**: Clear attribution while maintaining transparency about the deliberation process

#### 📊 Extracted Ranking (Machine-Readable)
- **Purpose**: Structured data format for downstream processing, analytics, or automation
- **Content**: JSON object with reviewer, ranking array, and timestamp
- **Format**:
```json
{
  "reviewer": "anthropic/claude-sonnet-4.5",
  "ranking": [
    "openai/gpt-5.2",
    "google/gemini-3-pro-preview",
    "x-ai/grok-4",
    "anthropic/claude-sonnet-4.5"
  ],
  "timestamp": "2026-01-21T00:27:18.000Z"
}
```
- **Why**: Enables programmatic analysis without parsing human-readable text

### 2. Visual Hierarchy & Clarity

- **Section Icons**: Each section has a clear emoji icon for quick identification
- **Color Coding**: 
  - Internal Deliberation: Neutral gray
  - Final Ranking: Blue highlight (important conclusion)
  - Extracted Ranking: Dark theme (technical/code format)
- **Borders**: Different border styles distinguish section purposes
  - Final Ranking: Solid blue left border (emphasis)
  - Extracted Ranking: Dashed border (technical data)

### 3. Semantic Improvements

**Before**: 
- Everything was de-anonymized inline
- "Extracted Ranking" just showed model names (redundant with text)
- Hard to see the anonymization at work

**After**:
- Anonymized text preserved in its original form
- Final Ranking shows both attribution AND original labels
- Extracted Ranking serves a distinct purpose (machine-readable)
- Clear separation between process (anonymous) and results (attributed)

## Benefits

1. **Transparency**: Users can verify anonymization actually happened during deliberation
2. **Clarity**: No confusion between deliberation process and final attribution
3. **Reusability**: Machine-readable format enables downstream analysis
4. **Trust**: Seeing both anonymous and attributed versions builds confidence
5. **Debugging**: Easier to identify parsing issues or ranking discrepancies

## Technical Details

### Files Modified

1. **`frontend/src/components/Stage2.jsx`**
   - Split text into evaluation and ranking sections
   - Created three distinct rendering sections
   - Added JSON formatting for machine-readable output

2. **`frontend/src/components/Stage2.css`**
   - Added styles for new section types
   - Color-coded different output purposes
   - Added dark theme for code/JSON display

3. **`CLAUDE.md`**
   - Updated documentation to reflect new output structure
   - Clarified de-anonymization strategy
   - Enhanced UI/UX transparency notes

### What Was NOT Changed

- **Deliberation logic**: Backend stage2_collect_rankings() unchanged
- **Ranking parsing**: parse_ranking_from_text() unchanged
- **Anonymization**: Label assignment and mapping unchanged
- **API**: No changes to backend endpoints or data structures

## Usage

Simply reload the application at http://localhost:5173 and submit a query. The Stage 2 output will automatically display the new three-section format.

## Example Output Structure

```
Stage 2: Peer Rankings
├── Reviewer: anthropic/claude-sonnet-4.5
├── 🔍 Internal Deliberation (Anonymized)
│   └── [Raw evaluation text with Response A, B, C, D]
├── 🏆 Final Ranking (De-anonymized)
│   ├── 1. gpt-5.2 (Response A)
│   ├── 2. gemini-3-pro-preview (Response C)
│   ├── 3. claude-sonnet-4.5 (Response B)
│   └── 4. grok-4 (Response D)
└── 📊 Extracted Ranking (Machine-Readable)
    └── {"reviewer": "...", "ranking": [...], "timestamp": "..."}
```

## Future Enhancements

Potential improvements for future versions:
- Export rankings to CSV for analysis
- Compare rankings across multiple queries
- Aggregate statistics on model performance
- API endpoint specifically for machine-readable rankings
- Batch processing of multiple queries

---

**Status**: ✅ Implemented and deployed
**Version**: 1.0.0
**Date**: 2026-01-21
