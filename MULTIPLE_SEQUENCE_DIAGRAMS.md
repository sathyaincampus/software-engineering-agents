# Multiple Sequence Diagrams - Implementation Guide

## Problem Statement

Currently, we only generate **1 sequence diagram** per project, which only shows one user flow (e.g., login).

For a comprehensive architecture, we should have **multiple sequence diagrams** showing different scenarios:
- User authentication
- Create/update/delete operations
- Synchronization flows
- Real-time notifications
- Payment processing
- Error handling

---

## Solution: Array of Sequence Diagrams

### Backend Changes ✅

**File**: `backend/app/agents/architecture/software_architect.py`

**Changed**:
```python
# OLD - Single diagram
"sequence_diagram": {
    "format": "mermaid",
    "code": "..."
}

# NEW - Array of diagrams
"sequence_diagrams": [
    {
        "name": "User Login Flow",
        "description": "User authentication and session creation",
        "format": "mermaid",
        "code": "..."
    },
    {
        "name": "Create Event Flow",
        "description": "Creating a calendar event",
        "format": "mermaid",
        "code": "..."
    },
    ...
]
```

**Requirements Updated**:
- Generate 3-5 sequence diagrams
- Each with unique name and description
- Cover key user flows based on project type
- Show happy path for each scenario

---

## Frontend Changes (To Implement)

### 1. Update State & Refs

Need to handle multiple diagrams instead of just one:

```tsx
// Current - single diagram
const [sequenceError, setSequenceError] = useState<string | null>(null);
const sequenceDiagramRef = useRef<HTMLDivElement>(null);

// New - multiple diagrams
const [sequenceErrors, setSequenceErrors] = useState<Map<number, string>>(new Map());
const sequenceDiagramRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
```

### 2. Update Rendering Logic

Render all sequence diagrams:

```tsx
// Get diagrams (backward compatible)
const sequenceDiagrams = data.sequence_diagrams || 
    (data.sequence_diagram ? [{
        name: "User Flow",
        description: "Main user flow",
        ...data.sequence_diagram
    }] : []);

// Render each diagram
sequenceDiagrams.forEach((diagram, index) => {
    const ref = sequenceDiagramRefs.current.get(index);
    if (diagram.code && ref) {
        const id = `sequence-${index}-${Date.now()}`;
        const { svg } = await mermaid.render(id, diagram.code);
        ref.innerHTML = svg;
    }
});
```

### 3. Update UI Display

Show all diagrams with tabs or accordion:

```tsx
{/* Sequence Diagrams - Multiple */}
{sequenceDiagrams && sequenceDiagrams.length > 0 && (
    <div>
        <h2>Sequence Diagrams</h2>
        {sequenceDiagrams.map((diagram, index) => (
            <div key={index}>
                <h3>{diagram.name}</h3>
                <p>{diagram.description}</p>
                <div ref={el => sequenceDiagramRefs.current.set(index, el)} />
            </div>
        ))}
    </div>
)}
```

---

## Example: Family Calendar App

For your project, we should have these sequence diagrams:

### 1. User Authentication Flow
```
Client → API → Auth Service → DB → Cache → Client
Shows: Login, JWT generation, session storage
```

### 2. Create Calendar Event Flow
```
Client → API → Calendar Service → DB → Sync Service → Google API
Shows: Event creation, database insert, Google Calendar sync
```

### 3. Complete Task Flow
```
Client → API → Task Service → DB → Reward Service → Notification Service → Client
Shows: Task completion, points award, notification
```

### 4. Redeem Reward Flow
```
Client → API → Reward Service → DB → User Service → Notification Service → Parent Client
Shows: Reward redemption, approval request, parent notification
```

### 5. Real-time Notification Flow
```
Server Event → Notification Service → Socket.IO → WebSocket → Client
Shows: Push notification delivery via WebSocket
```

### 6. Google Calendar Sync Flow
```
Google Webhook → API → Sync Service → DB → Calendar Service → Client
Shows: Incoming Google Calendar changes, sync to app
```

---

## Benefits

### For Developers
- ✅ Complete understanding of all user flows
- ✅ See how different features interact
- ✅ Identify potential bottlenecks
- ✅ Better error handling design

### For Subsequent Agents
- ✅ **Code Generator**: Knows all API endpoints needed
- ✅ **Test Agent**: Can create E2E tests for each flow
- ✅ **Documentation Agent**: Can document all scenarios
- ✅ **Debugger Agent**: Understands expected behavior

### For Project Understanding
- ✅ Comprehensive view of system behavior
- ✅ Shows integration points
- ✅ Highlights dependencies
- ✅ Documents business logic

---

## How Agents Use Multiple Diagrams

### 1. Code Generator Agent
```python
# Reads sequence diagrams to understand:
for diagram in architecture['sequence_diagrams']:
    # Extract API endpoints
    endpoints = extract_endpoints(diagram['code'])
    
    # Generate route handlers
    generate_routes(endpoints)
    
    # Generate service methods
    generate_services(diagram['name'])
```

### 2. Test Agent
```python
# Creates E2E test for each flow
for diagram in architecture['sequence_diagrams']:
    test_name = f"test_{diagram['name'].lower().replace(' ', '_')}"
    
    # Generate test case
    generate_e2e_test(
        name=test_name,
        description=diagram['description'],
        flow=parse_sequence(diagram['code'])
    )
```

### 3. Documentation Agent
```python
# Documents each user flow
for diagram in architecture['sequence_diagrams']:
    doc_section = {
        'title': diagram['name'],
        'description': diagram['description'],
        'diagram': diagram['code'],
        'steps': extract_steps(diagram['code'])
    }
    add_to_docs(doc_section)
```

---

## Backward Compatibility

The system supports both formats:

```typescript
// Old format still works
{
    "sequence_diagram": { "format": "mermaid", "code": "..." }
}

// New format
{
    "sequence_diagrams": [
        { "name": "Flow 1", "code": "..." },
        { "name": "Flow 2", "code": "..." }
    ]
}

// Frontend handles both
const diagrams = data.sequence_diagrams || 
    (data.sequence_diagram ? [{ name: "Main Flow", ...data.sequence_diagram }] : []);
```

---

## Next Steps

1. ✅ **Backend Updated** - Agent now generates multiple diagrams
2. ⏳ **Frontend Update Needed** - Display multiple diagrams
3. ⏳ **Update Existing Project** - Add multiple diagrams to your project
4. ⏳ **Test Generation** - Verify agents can use multiple diagrams

---

## Implementation Priority

### High Priority (Do Now)
1. Update frontend to display multiple sequence diagrams
2. Add multiple diagrams to existing project
3. Test that all diagrams render correctly

### Medium Priority (Do Soon)
1. Update code generator to use all diagrams
2. Update test agent to create tests for all flows
3. Add diagram selection/filtering in UI

### Low Priority (Nice to Have)
1. Add diagram comparison view
2. Add diagram export functionality
3. Add diagram validation

---

## Questions Answered

**Q: How do subsequent agents understand multiple diagrams?**
A: Each agent iterates through the `sequence_diagrams` array and processes each flow individually. The `name` and `description` fields help agents understand the context.

**Q: Will flows work flawlessly if we update?**
A: Yes! The array structure makes it easy to:
- Add new flows without breaking existing ones
- Update individual flows independently
- Remove deprecated flows
- Agents process each diagram separately

**Q: How many diagrams should we generate?**
A: 3-5 diagrams covering:
- Core user flows (login, CRUD operations)
- Integration flows (external APIs, webhooks)
- Real-time flows (notifications, sync)
- Payment/subscription flows (if applicable)

---

## Summary

✅ **Backend Agent Updated** - Generates 3-5 sequence diagrams  
✅ **TypeScript Interface Updated** - Supports array of diagrams  
⏳ **Frontend Rendering** - Need to implement multi-diagram display  
⏳ **Project Update** - Need to add diagrams to existing project  

Multiple sequence diagrams provide comprehensive documentation that all agents can use to generate better code, tests, and documentation!
