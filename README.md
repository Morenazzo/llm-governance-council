LLM Governance Council

![LLM Governance Council](assets/llm-governance-council-header.png)

A research prototype for Minimum Viable AI Governance via multi-model deliberation

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

OPENROUTER_API_KEY=sk-or-v1-...


Obtain an API key from openrouter.ai
 and ensure sufficient credits are available.

3. Configure Models (Optional)

You can customize council members and the Chairman in backend/config.py:

COUNCIL_MODELS = [
    "openai/gpt-5.2",
    "google/gemini-3-pro-preview",
    "anthropic/claude-sonnet-4.5",
    "x-ai/grok-4",
]

CHAIRMAN_MODEL = "google/gemini-3-pro-preview"

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