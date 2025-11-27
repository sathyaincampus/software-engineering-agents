# Final Mermaid Fix - Sequence Diagram Alt Block Issue

## Problem Identified

The AI keeps generating `alt` blocks in sequence diagrams despite instructions not to:

```mermaid
alt EventCreatedSuccessfully
    Calendar-->>-API: Success
else EventCreationFailed
    Calendar-->>-API: Failed
end
```

This causes: **"Trying to inactivate an inactive participant"** error

## Root Cause

`alt/else` blocks have complex activation/deactivation rules that are hard to get right. The AI doesn't understand that deactivating inside an `alt` block when the participant was activated outside causes errors.

## Solution Applied

### Updated Instructions to be EXTREMELY Explicit:

1. **Added FORBIDDEN section:**
   - NO alt blocks
   - NO else blocks  
   - NO loop blocks
   - NO opt blocks
   - ONLY simple linear flows

2. **Added WRONG example:**
   ```
   ❌ WRONG EXAMPLE (DO NOT DO THIS):
   alt EventCreatedSuccessfully
       Calendar-->>-API: Success
   else EventCreationFailed
       Calendar-->>-API: Failed
   end
   ```

3. **Added CORRECT example:**
   ```
   ✅ CORRECT EXAMPLE (DO THIS):
   sequenceDiagram
       participant Client
       participant API
       participant DB
       
       Client->>+API: POST /events
       API->>+DB: Insert Event
       DB-->>-API: Event Created
       API-->>-Client: Success Response
   ```

4. **Added to checklist:**
   - NO alt, loop, opt, or else keywords ANYWHERE
   - Sequence shows ONLY the happy path (success case)

5. **Emphasized:**
   "Keep it SIMPLE. Show ONE happy path only."

## Expected Behavior After Fix

When you click Regenerate:
- ✅ System diagram renders (flowchart)
- ✅ Sequence diagram renders (simple linear flow, no alt blocks)
- ✅ Zoom works for both diagrams
- ✅ No activation/deactivation errors

## If It Still Fails

The AI might not be reading the instructions carefully. In that case:

1. **Manual fix:** Edit the generated Mermaid code to remove `alt` blocks
2. **Report to AI:** Show the exact error and generated code
3. **Alternative:** Use a simpler sequence diagram with max 4 participants

## Files Modified

- `/backend/app/agents/architecture/software_architect.py`
  - Added explicit FORBIDDEN section
  - Added WRONG vs CORRECT examples
  - Updated validation checklist

---

**Try Regenerate now!** The instructions are now as explicit as possible about avoiding `alt` blocks.
