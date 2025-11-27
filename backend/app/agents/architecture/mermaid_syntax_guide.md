# Mermaid Syntax Guide for Architecture Diagrams

## Flowchart Syntax

### Basic Structure
```
flowchart TD
    %% This is a comment
    A[Node A]
    B(Node B)
    C{Decision}
    D[(Database)]
```

### Directions
- `TD` or `TB` - Top to bottom
- `LR` - Left to right
- `RL` - Right to left
- `BT` - Bottom to top

### Node Shapes
- `A[Rectangle]` - Rectangle with text
- `B(Rounded)` - Rounded edges
- `C{Diamond}` - Decision/conditional
- `D[(Database)]` - Cylinder (database)
- `E([Stadium])` - Stadium shape
- `F[[Subroutine]]` - Subroutine
- `G((Circle))` - Circle

### Links/Arrows
- `A --> B` - Arrow link
- `A --- B` - Open link (no arrow)
- `A -- Text --> B` - Link with text
- `A -.-> B` - Dotted link
- `A ==> B` - Thick link

### Subgraphs
```
subgraph Title
    A[Node 1]
    B[Node 2]
end
```

## Sequence Diagram Syntax

### Basic Structure
```
sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob
    B->>A: Hello Alice
```

### Arrow Types
- `->` - Solid line without arrow
- `-->` - Dotted line without arrow
- `->>` - Solid line with arrowhead
- `-->>` - Dotted line with arrowhead
- `-x` - Solid line with cross at end
- `--x` - Dotted line with cross at end

### Activations
```
sequenceDiagram
    Alice->>+John: Hello John
    John-->>-Alice: Great!
```

### Loops
```
sequenceDiagram
    Alice->>Bob: Hello
    loop Every minute
        Bob->>Alice: Great!
    end
```

### Alt/Else
```
sequenceDiagram
    Alice->>Bob: Hello
    alt is sick
        Bob->>Alice: Not so good
    else is well
        Bob->>Alice: Feeling fresh
    end
```

## Common Mistakes to Avoid

1. **Don't use `&` for multiple connections** - Use separate lines instead
   ```
   ❌ Wrong: C --> C1 & C2 & C3
   ✅ Right: 
   C --> C1
   C --> C2
   C --> C3
   ```

2. **Subgraph syntax** - Must use proper format
   ```
   ❌ Wrong: subgraph Backend Services
   ✅ Right: subgraph "Backend Services"
   ```

3. **Special characters** - Escape or use quotes
   ```
   ❌ Wrong: A[Service (API)]
   ✅ Right: A["Service (API)"]
   ```

4. **Comments** - Use `%%` for comments
   ```
   %% This is a comment
   ```

## Best Practices

1. Use meaningful node IDs (e.g., `ClientApp`, `APIGateway`)
2. Keep diagrams simple and focused
3. Use subgraphs to group related components
4. Add descriptive text on links when needed
5. Use appropriate node shapes for different component types
