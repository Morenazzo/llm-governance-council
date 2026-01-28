LLM Governance Council

![LLM Governance Council](assets/images/LlM%20Governance%20Council%20.png)

**A Local Multi-Model AI Governance & Decision Framework**

A research prototype for Minimum Viable AI Governance via multi-model deliberation

⚠️ **This is not legal advice** - See [DISCLAIMER.md](DISCLAIMER.md) for complete terms

Overview

LLM Governance Council is a research-oriented prototype that explores how multi-model deliberation can function as a Minimum Viable AI Governance (MVG) mechanism for real-world organizational decision-making.

Instead of relying on a single large language model (LLM), this system orchestrates a council of diverse LLMs to:

independently analyze a problem,

critically review each other’s reasoning, and

synthesize a final, more robust decision.

The project is motivated by a practical AI safety problem:

Single-model AI systems are prone to correlated errors, hallucinations, and overconfident reasoning—especially in governance and risk-sensitive contexts.

This repository investigates whether structured disagreement + collective judgment can reduce these failure modes without introducing heavyweight enterprise governance frameworks.

Why LLM Councils for AI Governance?

Most organizations today face a governance gap:

Employees are already using AI (“Shadow AI”)

Formal governance frameworks are too slow or complex

Bans increase risk by pushing usage underground

This project treats AI governance as an operational safety problem, not a compliance checkbox.

An LLM Council acts as:

a cognitive circuit breaker against single-model failure

a lightweight form of separation of duties

a foundation for governance-as-code

How the Council Works

When a user submits a query, the system executes a three-stage deliberation process:

Stage 1 — Independent Deliberation

Each LLM receives the query independently and produces its own response.

In the governance-focused variant, each model is also assigned an explicit safety-oriented role (e.g., ethical analyst, adversarial reviewer, systems thinker) to encourage structured disagreement and reduce correlated reasoning.

Stage 2 — Peer Review & Ranking

Each model is shown anonymized responses from the other models and asked to:

evaluate strengths and weaknesses

rank responses based on accuracy, insight, and risk awareness

Model identities are hidden to prevent favoritism.

Stage 3 — Synthesis

A designated Chairman model synthesizes:

individual responses

peer rankings

points of agreement and disagreement

The result is a single, defensible final answer representing the council’s collective judgment.

Research Focus

This repository supports comparative research across three configurations:

Single-Model Baseline
One LLM answers the question directly.

Baseline LLM Council
Multiple LLMs deliberate without explicit roles.

Role-Based Governance Council (this repo’s primary contribution)
The same council, but with explicit safety and governance roles introduced at Stage 1.

Key research questions include:

Does multi-model deliberation reduce hallucinations and blind spots?

Do explicit roles change the quality or robustness of governance decisions?

Can this approach serve as a Minimum Viable AI Governance mechanism for mid-market organizations?

Important Scope Notes

This is a research prototype, not a production system.

It prioritizes clarity, inspectability, and experimental control over performance or cost optimization.

The system is intentionally simple to allow easy modification and extension for further research.

Setup
1. Install Dependencies

The project uses uv
 for Python dependency management.

Backend

uv sync


Frontend

cd frontend
npm install
cd ..

2. Configure API Key

Create a .env file in the project root:

OPENROUTER_API_KEY=your_api_key_here


Obtain an API key from openrouter.ai
 and ensure sufficient credits are available.

You can copy the template file:
```bash
cp .env.example .env
```

Then edit `.env` and replace `your_api_key_here` with your actual OpenRouter API key.

3. Configure Models (Optional)

You can customize council members and the Chairman in backend/config.py:

COUNCIL_MODELS = [
    CHATGPT_MODEL_ID,   # ChatGPT model (configurable)
    "google/gemini-3-pro-preview",
    "anthropic/claude-sonnet-4.5",
    "x-ai/grok-4",
    MISTRAL_MODEL_ID,   # Mistral model (configurable)
]

CHAIRMAN_MODEL = "google/gemini-3-pro-preview"

### Council Members & Roles

The council consists of **5 specialized AI models**, each with a unique governance role:

| Model | Role | Focus Area | Stages |
|-------|------|------------|--------|
| **GPT-5.2** | Systems Integrator | Integration risks & failure modes | 1, Delphi, 2 |
| **Gemini 3 Pro** | Systems Architect + Chairman | Architecture + final synthesis | 1, Delphi, 2, **3** |
| **Claude Sonnet 4.5** | Ethics Officer | Ethics & alignment | 1, Delphi, 2 |
| **Grok 4** | Red Team | Adversarial review | 1, Delphi, 2 |
| **Mistral Large** | Safety Engineer | Technical controls | 1, Delphi, 2 |

**Key Points**:
- All 5 models participate in Stage 1 (individual responses), Delphi (iterative reflection), and Stage 2 (peer rankings)
- Only Gemini serves as Chairman for Stage 3 (final synthesis)
- Each model brings a specialized perspective to reduce correlated failures

### GPT-5.2 Integration

GPT-5.2 serves as the **Systems Integrator & Failure-Mode Analyst**, focusing on:
- Integration risks and cross-component dependencies
- Failure mode identification and cascade effects
- Fault propagation paths
- Resilience strategies
- System-wide impact assessment

**Configure GPT-5.2 Model:**

**CRITICAL**: GPT-5.2 is intentionally selected for superior reasoning quality and systems analysis.

```bash
# Default model - CORRECT model ID is openai/gpt-5.2
CHATGPT_MODEL_ID=openai/gpt-5.2

# WARNING: Do NOT use openai/chatgpt-5.2 (does not exist)
# Do NOT downgrade to gpt-4o - reduces analysis quality

# Other GPT-5 variants available on OpenRouter:
# CHATGPT_MODEL_ID=openai/gpt-5.2-chat
# CHATGPT_MODEL_ID=openai/gpt-5.2-pro
# CHATGPT_MODEL_ID=openai/gpt-5.2-codex
```

**Note**: GPT-5.2 provides advanced reasoning capabilities critical for:
- Complex system failure analysis
- Multi-component integration risk assessment
- Cascade effect prediction
- Deep systems thinking

**Model ID Format**: Use `openai/gpt-5.2` (NOT `openai/chatgpt-5.2`).

### Mistral Integration

Mistral is included as the **Safety Engineer** focused on Shadow AI & Data Leakage prevention. Mistral's role emphasizes technical controls:
- AI gateways and allowlisting
- DLP (Data Loss Prevention) and redaction
- Logging and audit trails
- Kill switches and emergency controls
- Go/no-go recommendations with evidence

**Configure Mistral Model:**

You can specify which Mistral model to use via the `MISTRAL_MODEL_ID` environment variable in your `.env` file:

```bash
# Default model (if not specified)
MISTRAL_MODEL_ID=mistralai/mistral-large-2407

# Other options available on OpenRouter:
# MISTRAL_MODEL_ID=mistralai/mistral-medium
# MISTRAL_MODEL_ID=mistralai/mistral-small
```

See [OpenRouter Models](https://openrouter.ai/models) for all available Mistral variants.

**Test Mistral Integration:**

Run the included test script to verify Mistral is working correctly:

```bash
python test_mistral.py
```

This test will:
1. Verify Mistral responds via OpenRouter
2. Check that the Safety Engineer role is active
3. Ensure other council members still work (graceful degradation)
4. Run a Shadow AI governance test prompt

**Note:** Only one API key (OpenRouter) is required. All models, including Mistral, use OpenRouter as the gateway.

### Delphi Mode (Optional)

The system supports an optional **Delphi Mode** that adds an iterative reflection stage where models can revise their responses after seeing anonymized peer feedback.

**Enable Delphi Mode:**

```bash
# In .env file
DELPHI_MODE=true
```

**How It Works:**

When Delphi Mode is enabled, a new Stage 1.5 is inserted between Stage 1 and Stage 2:

1. **Stage 1**: Models generate initial responses independently
2. **Stage 1.5 (Delphi Reflection)**: 
   - Each model receives anonymized digest of peer responses
   - Model decides to REVISE or AFFIRM its original response
   - Provides justification for decision
   - Generates Round 2 response (revised or reaffirmed)
   - System detects material disagreements and high-risk triggers
3. **Stage 2**: Models rank responses (using Round 2 if Delphi enabled)
4. **Stage 3**: Chairman synthesizes final answer

**Benefits:**
- ✅ Models self-correct after seeing peer perspectives
- ✅ Convergence toward better solutions through iteration
- ✅ Detection of material disagreements requiring human review
- ✅ Higher quality analysis at cost of longer processing time

**Trade-offs:**

| Mode | Processing Time | Analysis Depth | Use Case |
|------|----------------|----------------|----------|
| **Standard** | 5-7 minutes | Good | Quick governance decisions |
| **Delphi** | 10-15 minutes | Excellent | Critical high-stakes decisions |

**Recommendation**: Use Delphi Mode for complex, high-stakes governance decisions where superior analysis quality justifies the longer wait time.

### Reference Documents

The system supports attaching reference documents/policies as context for analysis.

**How to Use:**

1. Click "Reference Documents" to expand the section
2. Choose one of two options:
   - **📁 Upload File**: Select a file from your computer (.txt, .md, .csv, .json, .xml, .yaml, .pdf)
   - **✏️ Paste Text**: Manually paste document content
3. Review/edit the auto-filled title and content
4. Click "Add Document"

**Supported File Formats:**
- ✅ Text files (.txt, .md)
- ✅ Data files (.csv, .json, .xml, .yaml, .yml)
- ⚠️ PDF files (.pdf) - limited text extraction
- ❌ Word documents (.doc, .docx) - copy-paste text instead

**Features:**
- Upload files directly from your computer
- Multiple documents supported
- Document preview and management
- Remove documents individually
- Documents persist for follow-up questions
- Automatically included in council analysis

**Important:**
- ⚠️ **Do NOT upload confidential information**
- Sanitize and anonymize all content
- Documents are sent to third-party AI providers
- See [DISCLAIMER.md](DISCLAIMER.md) for full data privacy warnings

**Use Cases:**
- Company policies for context
- Regulatory requirements
- Industry guidelines
- Draft policies for review
- Technical constraints
- Organizational requirements

Running the Application
Option 1 — Start Script
./start.sh

Option 2 — Manual Startup

Terminal 1 (Backend)

uv run python -m backend.main


Terminal 2 (Frontend)

cd frontend
npm run dev


Open:
http://localhost:5173

### Expected Processing Times

**Standard Mode (DELPHI_MODE=false)**:
- Stage 1 (Individual Responses): 2-3 minutes
- Stage 2 (Peer Rankings): 2-3 minutes
- Stage 3 (Final Synthesis): 30 seconds
- **Total: ~5-7 minutes per query**

**Delphi Mode (DELPHI_MODE=true)**:
- Stage 1 (Round 1 Responses): 2-3 minutes
- Stage 1.5 (Delphi Reflection): 3-5 minutes
- Stage 2 (Peer Rankings): 2-3 minutes
- Stage 3 (Final Synthesis): 30 seconds
- **Total: ~10-15 minutes per query**

**Important**: 
- Do not refresh the page while processing
- The UI will show loading indicators for each stage
- Processing happens in parallel where possible
- Times may vary based on query complexity and API response times

Tech Stack

Backend: FastAPI (Python 3.10+), async httpx, OpenRouter API

Frontend: React + Vite, react-markdown

Storage: Local JSON-based conversation logs

Package Management: uv (Python), npm (JavaScript)

Relation to AI Safety & Ethics Research

This repository accompanies a formal research paper exploring:

AI governance as a safety problem

Shadow AI in mid-market organizations

Governance-as-code via multi-model deliberation

Trade-offs between speed, cost, and safety

The codebase is intended to support reproducibility, inspection, and further experimentation by researchers and practitioners.

License & Attribution

This project is inspired by the original LLM Council concept by Andrej Karpathy.
It has been independently modified and extended for AI governance and safety research purposes.

No official support or maintenance is provided.

Final note

If you are reading this repo expecting a polished product: this is not it.
If you are interested in how AI systems can help govern themselves more safely under real-world constraints, you are in the right place.