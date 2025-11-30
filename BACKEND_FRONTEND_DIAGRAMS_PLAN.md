# Backend & Frontend Architecture Diagrams - Implementation Plan

## Overview

Adding separate **Backend Architecture** and **Frontend Architecture** diagrams to match the Blue Ribbon project style.

---

## Changes Made

### 1. Backend Agent Updated ✅

**File**: `backend/app/agents/architecture/software_architect.py`

**Added Fields**:
```python
"backend_diagram": {
    "format": "mermaid",
    "code": "flowchart TD..."
},
"frontend_diagram": {
    "format": "mermaid",
    "code": "flowchart TD..."
}
```

**Updated Requirements**:
- Generate 4 diagrams total:
  1. `system_diagram` - Overall system architecture
  2. `backend_diagram` - Backend processing architecture
  3. `frontend_diagram` - Frontend UI architecture
  4. `sequence_diagram` - User request flow

### 2. Frontend Interface Updated ✅

**File**: `frontend/src/components/ArchitectureViewer.tsx`

**Added to Interface**:
```tsx
interface ArchitectureData {
    tech_stack?: TechStack;
    system_diagram?: SystemDiagram;
    backend_diagram?: SystemDiagram;      // ← NEW
    frontend_diagram?: SystemDiagram;     // ← NEW
    sequence_diagram?: SystemDiagram;
    ...
}
```

**Added State & Refs**:
```tsx
const [copiedBackend, setCopiedBackend] = useState(false);
const [copiedFrontend, setCopiedFrontend] = useState(false);
const [backendError, setBackendError] = useState<string | null>(null);
const [frontendError, setFrontendError] = useState<string | null>(null);
const backendDiagramRef = useRef<HTMLDivElement>(null);
const frontendDiagramRef = useRef<HTMLDivElement>(null);
const zoomBackendRef = useRef<HTMLDivElement>(null);
const zoomFrontendRef = useRef<HTMLDivElement>(null);
```

**Updated Zoom Type**:
```tsx
const [zoomedDiagram, setZoomedDiagram] = useState<
    'system' | 'backend' | 'frontend' | 'sequence' | null
>(null);
```

---

## Next Steps (To Complete)

### 1. Add Diagram Rendering Logic

Need to add rendering for backend and frontend diagrams in the `useEffect`:

```tsx
// Render backend diagram
if (data.backend_diagram?.code && backendDiagramRef.current) {
    try {
        backendDiagramRef.current.innerHTML = '';
        const id = `backend-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, data.backend_diagram.code);
        if (isMounted && backendDiagramRef.current) {
            backendDiagramRef.current.innerHTML = svg;
            setBackendError(null);
        }
    } catch (e: any) {
        console.error('Mermaid rendering error:', e);
        if (isMounted) {
            setBackendError(e.message || 'Failed to render diagram');
        }
    }
}

// Render frontend diagram
if (data.frontend_diagram?.code && frontendDiagramRef.current) {
    try {
        frontendDiagramRef.current.innerHTML = '';
        const id = `frontend-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, data.frontend_diagram.code);
        if (isMounted && frontendDiagramRef.current) {
            frontendDiagramRef.current.innerHTML = svg;
            setFrontendError(null);
        }
    } catch (e: any) {
        console.error('Mermaid rendering error:', e);
        if (isMounted) {
            setFrontendError(e.message || 'Failed to render diagram');
        }
    }
}
```

### 2. Add Zoom Modal Rendering

Update the zoom modal useEffect:

```tsx
if (zoomedDiagram === 'backend' && data.backend_diagram?.code && zoomBackendRef.current) {
    const id = `zoom-backend-${Date.now()}`;
    const { svg } = await mermaid.render(id, data.backend_diagram.code);
    zoomBackendRef.current.innerHTML = svg;
} else if (zoomedDiagram === 'frontend' && data.frontend_diagram?.code && zoomFrontendRef.current) {
    const id = `zoom-frontend-${Date.now()}`;
    const { svg } = await mermaid.render(id, data.frontend_diagram.code);
    zoomFrontendRef.current.innerHTML = svg;
}
```

### 3. Add Copy Functions

```tsx
const copyBackendDiagram = () => {
    if (data.backend_diagram?.code) {
        navigator.clipboard.writeText(data.backend_diagram.code);
        setCopiedBackend(true);
        setTimeout(() => setCopiedBackend(false), 2000);
    }
};

const copyFrontendDiagram = () => {
    if (data.frontend_diagram?.code) {
        navigator.clipboard.writeText(data.frontend_diagram.code);
        setCopiedFrontend(true);
        setTimeout(() => setCopiedFrontend(false), 2000);
    }
};
```

### 4. Add UI Sections

Add sections similar to system and sequence diagrams:

```tsx
{/* Backend Architecture Diagram */}
{data.backend_diagram?.code && (
    <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">Backend Processing Architecture</h2>
            <button
                onClick={copyBackendDiagram}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            >
                {copiedBackend ? <Check size={16} /> : <Copy size={16} />}
                {copiedBackend ? 'Copied!' : 'Copy Mermaid Code'}
            </button>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto relative group">
            <button
                onClick={() => setZoomedDiagram('backend')}
                className="absolute top-4 right-4 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Zoom diagram"
            >
                <Maximize2 size={16} />
            </button>
            <div ref={backendDiagramRef} className="mermaid-container" />
            {backendError && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 font-semibold mb-2">⚠️ Diagram Rendering Error:</p>
                    <p className="text-red-300 text-sm mb-3">{backendError}</p>
                    <details className="text-xs">
                        <summary className="cursor-pointer text-gray-400 hover:text-white">Show Raw Mermaid Code</summary>
                        <pre className="mt-2 p-3 bg-black/50 rounded overflow-x-auto text-gray-300">
                            {data.backend_diagram?.code}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    </div>
)}

{/* Frontend Architecture Diagram */}
{data.frontend_diagram?.code && (
    <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">Frontend UI Architecture</h2>
            <button
                onClick={copyFrontendDiagram}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
            >
                {copiedFrontend ? <Check size={16} /> : <Copy size={16} />}
                {copiedFrontend ? 'Copied!' : 'Copy Mermaid Code'}
            </button>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto relative group">
            <button
                onClick={() => setZoomedDiagram('frontend')}
                className="absolute top-4 right-4 p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Zoom diagram"
            >
                <Maximize2 size={16} />
            </button>
            <div ref={frontendDiagramRef} className="mermaid-container" />
            {frontendError && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 font-semibold mb-2">⚠️ Diagram Rendering Error:</p>
                    <p className="text-red-300 text-sm mb-3">{frontendError}</p>
                    <details className="text-xs">
                        <summary className="cursor-pointer text-gray-400 hover:text-white">Show Raw Mermaid Code</summary>
                        <pre className="mt-2 p-3 bg-black/50 rounded overflow-x-auto text-gray-300">
                            {data.frontend_diagram?.code}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    </div>
)}
```

### 5. Update Zoom Modal

Update the title logic in the zoom modal:

```tsx
<h2 className="text-2xl font-bold mb-6 text-white">
    {zoomedDiagram === 'system' ? 'System Architecture Diagram' : 
     zoomedDiagram === 'backend' ? 'Backend Processing Architecture' :
     zoomedDiagram === 'frontend' ? 'Frontend UI Architecture' :
     'Sequence Diagram'}
</h2>
<div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
    {zoomedDiagram === 'system' ? (
        <div ref={zoomSystemRef} className="mermaid-container" />
    ) : zoomedDiagram === 'backend' ? (
        <div ref={zoomBackendRef} className="mermaid-container" />
    ) : zoomedDiagram === 'frontend' ? (
        <div ref={zoomFrontendRef} className="mermaid-container" />
    ) : (
        <div ref={zoomSequenceRef} className="mermaid-container" />
    )}
</div>
```

---

## Expected Result

After completing these steps, the architecture view will show:

1. **Tech Stack** (existing)
2. **System Architecture Diagram** (existing)
3. **Backend Processing Architecture** (NEW) - Shows backend services, APIs, databases, processing engine
4. **Frontend UI Architecture** (NEW) - Shows UI layers, components, state management, routing
5. **Sequence Diagram** (existing)
6. **Database Schema** (existing)
7. **API Design Principles** (existing)

Each diagram will have:
- ✅ Copy button
- ✅ Expand/zoom button
- ✅ Error handling
- ✅ Fullscreen modal with Portal
- ✅ Color-coded (green for backend, cyan for frontend)

---

## Testing

1. **Generate Architecture** for a new project
2. **Verify 4 diagrams** are generated
3. **Check rendering** for all diagrams
4. **Test copy buttons** for each
5. **Test zoom modals** for each
6. **Verify error handling** if syntax errors occur

---

## Files to Complete

- `frontend/src/components/ArchitectureViewer.tsx` - Add rendering, copy functions, UI sections, zoom modal updates

Would you like me to complete the implementation now?
