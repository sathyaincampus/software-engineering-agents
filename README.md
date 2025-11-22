# ZeroToOne AI - Autonomous Software Engineering Platform

## Overview
ZeroToOne AI is a next-generation Agentic AI platform designed to take a vague user idea and autonomously deliver a fully deployed, production-ready application. It uses a "Mission Control" visual dashboard and a suite of specialized AI agents.

## Project Structure
- **backend/**: Python FastAPI application using Google ADK.
  - **app/core/**: Orchestrator and Session management.
  - **app/agents/**: Specialized agents (Strategy, Architecture, Engineering, Media).
- **frontend/**: React + TypeScript + Vite application.
  - **src/pages/**: UI pages like Boardroom, Mission Control.
  - **src/layouts/**: Dashboard layout.
- **shared/**: Shared protocols and data models.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Cloud Credentials (for ADK/Vertex AI)

### Quick Start
1. **Install Backend Dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Run the Platform:**
   You can run both services using the provided script:
   ```bash
   ./run.sh
   ```
   Or run them separately:
   - Backend: `uvicorn app.main:app --reload --port 8000` (in `backend/`)
   - Frontend: `npm run dev` (in `frontend/`)

## Features
- **Mission Control**: Central dashboard for project management.
- **Boardroom**: Interactive architecture canvas using ReactFlow.
- **Agent Orchestration**: Phase-based agent execution (Strategy -> Architecture -> Engineering).
- **Artifact Generation**: PRDs, Diagrams, Code, and Documentation.

## Status
- [x] Phase 1: Strategy Agents (Idea, PRD, Analysis)
- [x] Phase 2: Architecture Agents (Architect, UX)
- [ ] Phase 3: Engineering Agents (Coming Soon)
- [ ] Phase 4: Media Agents (Coming Soon)
