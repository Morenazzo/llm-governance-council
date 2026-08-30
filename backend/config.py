"""Configuration for the LLM Governance Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# ---------------------------------------------------------------------------
# Council roster
#
# Every id below is a real OpenRouter slug, verified against
# https://openrouter.ai/api/v1/models on 2026-08-29.
# Each seat is overridable via environment variable so you can swap a single
# model without touching code. Governance roles are assigned by vendor prefix
# (see backend/council.py), so bumping a version never drops a seat's role.
# ---------------------------------------------------------------------------

# OpenAI seat - "Systems Integrator". Flagship of the GPT-5.6 series.
# Alternatives: openai/gpt-5.6-terra (balanced), openai/gpt-5.6-luna (economico),
#               openai/gpt-5.5-pro (razonamiento extendido, mucho mas caro).
# WARNING: do NOT downgrade to gpt-4o or gpt-5.2 - degrades analysis quality.
CHATGPT_MODEL_ID = os.getenv("CHATGPT_MODEL_ID", "openai/gpt-5.6-sol")

# Anthropic seat - "Ethics Officer". Flagship for long-form critical review.
# Alternatives: anthropic/claude-sonnet-5 (mas barato), anthropic/claude-opus-5-fast.
CLAUDE_MODEL_ID = os.getenv("CLAUDE_MODEL_ID", "anthropic/claude-opus-5")

# Google seat - "Systems Architect" (tambien preside el consejo).
# Alternatives: google/gemini-3.7-flash (rapido y barato).
GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "google/gemini-3.1-pro-preview")

# xAI seat - "Red Team".
GROK_MODEL_ID = os.getenv("GROK_MODEL_ID", "x-ai/grok-4.6")

# Mistral seat - "Safety Engineer".
# NOTE: mistralai/mistral-large-2512 is the stronger model but returned HTTP 429
# (no upstream capacity for this account) on 2026-08-29, so the working default
# is Medium 3.5. Switch back via MISTRAL_MODEL_ID once Large has capacity.
# Alternatives: mistralai/mistral-large-2512, mistralai/mistral-small-2603.
MISTRAL_MODEL_ID = os.getenv("MISTRAL_MODEL_ID", "mistralai/mistral-medium-3-5")

# Council members - list of OpenRouter model identifiers
COUNCIL_MODELS = [
    CHATGPT_MODEL_ID,
    GEMINI_MODEL_ID,
    CLAUDE_MODEL_ID,
    GROK_MODEL_ID,
    MISTRAL_MODEL_ID,
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = os.getenv("CHAIRMAN_MODEL", GEMINI_MODEL_ID)

# Small, cheap model used only to title conversations
TITLE_MODEL = os.getenv("TITLE_MODEL", "google/gemini-3.7-flash")

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"

# Delphi Mode - Enable iterative reflection rounds
# Set to True to enable Stage 1.5 where models can revise after seeing peer feedback
DELPHI_MODE = os.getenv("DELPHI_MODE", "false").lower() == "true"
