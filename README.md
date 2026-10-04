# AutoDev AI: Enterprise Multi-Agent Engineering Pipeline

## Overview
AutoDev AI is a decoupled, autonomous code generation platform designed for enterprise engineering workflows. It utilizes a specialized 3-agent architecture to autonomously plan, write, and QA Python code within a secure execution sandbox. The system is equipped with Model Context Protocol (MCP) capabilities, allowing agents to independently deploy verified code to external environments like GitHub Gists.

## Core Architecture
The pipeline separates routing, intelligence, and tool execution into a scalable microservices architecture:
1. **System Architect Agent:** Analyzes raw requirements and generates step-by-step logical execution plans.
2. **Senior Python Developer Agent:** Drafts optimized, well-commented code based strictly on the architectural plan.
3. **QA Engineer Agent:** Injects the drafted code into an isolated Python sandbox for execution. Analyzes tracebacks, fixes errors autonomously, and utilizes MCP tools for external deployment upon successful verification.

## Key Features
* **Model Context Protocol (MCP) Integration:** Agents possess autonomous decision-making capabilities to utilize external APIs (e.g., GitHub Gist Publisher) based on contextual prompt requirements without manual UI triggers.
* **Semantic Caching Engine:** Integrated with Supabase pgvector. The system computes embeddings for incoming prompts and bypasses the LLM pipeline for requests exceeding a 0.88 similarity threshold, resulting in near-instantaneous responses and reduced API overhead.
* **Security Guardrails:** Pre-processing LLM evaluation blocks prompt injections, malicious execution requests, and out-of-scope queries before they reach the agentic pipeline.
* **Enterprise Frontend Visualization:** Next.js interface featuring real-time terminal simulation for agent execution logs and VS Code-style syntax highlighting via React Syntax Highlighter.

## Technology Stack
* **Intelligence & Orchestration:** CrewAI, LangChain, Google Gemini 2.5 Flash
* **Backend Infrastructure:** FastAPI, Python Subprocess Sandbox, Uvicorn
* **Database & Vector Storage:** Supabase (PostgreSQL + pgvector)
* **Frontend Application:** Next.js, Tailwind CSS, TypeScript

## Environment Variables Configuration
To run this project locally, create a `.env` file in the root directory with the following variables:

GEMINI_API_KEY="your_google_gemini_api_key"
SUPABASE_URL="your_supabase_project_url"
SUPABASE_KEY="your_supabase_anon_key"
GITHUB_TOKEN="your_github_classic_token_with_gist_permissions"
NEXT_PUBLIC_API_URL="http://localhost:8000"

## Local Development Setup

### Backend Initialization
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload

### Frontend Initialization
cd frontend
npm install
npm run dev
