# ZeroToOne AI - Implementation Guide

## 1. Project Structure
- `backend/`: Python FastAPI application using Google ADK.
- `frontend/`: React + TypeScript + Vite application.
- `shared/`: Shared protocols and data models.

## 2. Setup Instructions
### Backend
1. Navigate to `backend/`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the server: `uvicorn app.main:app --reload`.

### Frontend
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Run the dev server: `npm run dev`.

## 3. Architecture
- **Orchestrator**: Central brain managing the state machine.
- **Agents**: Specialized ADK agents for each phase.
- **Communication**: Strict JSON protocol via `TaskDelegation` and `TaskResult`.

## 4. Current Progress
- [x] Project Scaffold
- [x] Protocol Definitions
- [x] Frontend Initialization
- [x] Orchestrator Implementation
- [x] Agent Implementation (Phase 1 & 2 Complete)
  - [x] Idea Generator
  - [x] Product Requirements
  - [x] Requirement Analysis
  - [x] Software Architect
  - [x] UX Designer
- [x] UI Implementation
  - [x] Dashboard Layout
  - [x] Boardroom (Architecture Canvas)
  - [x] Routing
- [x] Engineering Agents (Phase 3 Complete)
  - [x] Engineering Manager
  - [x] Backend Developer
  - [x] Frontend Developer
  - [x] QA Agent
- [ ] Media Agents (Phase 4)
