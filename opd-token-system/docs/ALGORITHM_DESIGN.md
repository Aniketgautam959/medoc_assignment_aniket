# Algorithm Design & Implementation Details

## Overview

The OPD Token Allocation Engine implements a **priority-based queuing system** with **dynamic reallocation** and **elastic capacity management** to handle real-world hospital OPD scenarios.

---

## Core Algorithm Components

### 1. Priority-Based Token Allocation

**Priority Ordering** (Lower number = Higher priority):
1. **Emergency (Priority 1)**: Life-threatening cases requiring immediate attention
2. **Paid Priority (Priority 2)**: Premium service patients
3. **Follow-up (Priority 3)**: Returning patients for continued treatment
4. **Online Booking (Priority 4)**: Pre-scheduled appointments
5. **Walk-in (Priority 5)**: Same-day walk-in patients

**Rationale**:
- Emergency patients must be seen immediately regardless of queue
- Paid priority provides revenue while maintaining medical ethics
- Follow-ups ensure continuity of care
- Online bookings encourage advance planning
- Walk-ins have lowest priority to incentivize booking

### 2. Slot Allocation Strategy

**Algorithm**: First-Fit with Priority Queue

```
FUNCTION allocateToken(request):
  1. Validate doctor and slot exist
  2. Create token with priority based on source
  3. IF slot has available capacity:
       - Allocate token immediately
       - Increment slot counter
       - Return success
  4. ELSE:
       - Add to priority-ordered waiting queue
       - Return waiting position
```

**Time Complexity**: O(1) for allocation, O(n log n) for queue insertion
**Space Complexity**: O(n) where n = total tokens

---

## Dynamic Reallocation

### Trigger Events
1. **Token Cancellation**: Patient cancels appointment
2. **No-Show**: Patient doesn't arrive for allocated slot
3. **Capacity Increase**: Doctor extends slot capacity
4. **Token Completion**: Patient consultation finished early

### Reallocation Algorithm

```
FUNCTION reallocateWaitingTokens(doctorId, slotId):
  1. Get all waiting tokens for this doctor/slot
  2. Sort by priority (already maintained in queue)
  3. WHILE slot has capacity AND waiting queue not empty:
       - Pop highest priority token from queue
       - Allocate to slot
       - Update token status to ALLOCATED
       - Notify patient (in production)
  4. Return count of reallocated tokens
```

**Key Features**:
- Automatic and immediate
- Maintains priority ordering
- No manual intervention required
- Ensures optimal slot utilization

---

## Emergency Insertion with Bump-Down

### Algorithm

```
FUNCTION insertEmergency(request):
  1. Create emergency token (priority = 1)
  2. IF slot has capacity:
       - Allocate immediately
       - Return success
  3. ELSE:
       - Find lowest priority allocated token in slot
       - IF lowest priority > emergency priority:
            * Bump that token to waiting queue
            * Allocate emergency token
            * Return success with bump notification
       - ELSE:
            * Add emergency to front of waiting queue
            * Return waiting status
```

**Edge Case Handling**:
- If all allocated tokens are also emergencies, new emergency goes to waiting queue
- Bumped tokens retain their original priority
- Bumped tokens go to front of their priority tier in waiting queue

---

## Hard Limit Enforcement

### Capacity Constraints

**Rule**: `slot.currentCount <= slot.maxCapacity` (ALWAYS)

**Enforcement Points**:
1. Before every allocation
2. During emergency insertion
3. On capacity updates

**Validation**:
```typescript
if (slot.currentCount >= slot.maxCapacity) {
  // Reject allocation or add to waiting queue
  // NO exceptions except emergency bump-down
}
```

---

## Edge Cases & Failure Handling

### 1. Concurrent Allocation Requests

**Problem**: Two patients request last available slot simultaneously

**Solution**: 
- In-memory operations are synchronous in Node.js single-threaded model
- For production: Implement mutex locks or database transactions
- Current implementation: Sequential processing via event loop

### 2. Doctor Unavailability

**Problem**: Doctor becomes unavailable after tokens allocated

**Handling**:
```typescript
// Future enhancement
FUNCTION handleDoctorUnavailability(doctorId):
  1. Get all allocated tokens for doctor
  2. Move all to waiting queue
  3. Attempt reallocation to other doctors (same specialization)
  4. Notify affected patients
```

**Current Implementation**: Manual cancellation of tokens required

### 3. Time Slot Conflicts

**Problem**: Patient tries to book overlapping slots

**Prevention**:
- Each token is for single slot only
- No cross-slot validation in current version
- Future: Add patient-level booking history check

### 4. Capacity Reduction

**Problem**: Slot capacity reduced below current allocation

**Handling**:
```typescript
FUNCTION updateSlotCapacity(slotId, newCapacity):
  IF newCapacity < slot.currentCount:
    // Option 1: Reject capacity reduction
    RETURN error("Cannot reduce below current allocation")
    
    // Option 2: Bump lowest priority tokens (not implemented)
    // Bump (currentCount - newCapacity) lowest priority tokens
```

**Current Implementation**: Option 1 (implicit - no bumping on reduction)

### 5. No-Show Patterns

**Problem**: Frequent no-shows waste capacity

**Tracking** (Future Enhancement):
```typescript
// Track patient history
interface PatientHistory {
  totalBookings: number;
  noShows: number;
  noShowRate: number;
}

// Adjust priority based on history
IF patient.noShowRate > 0.3:
  token.priority += 1  // Lower priority
```

**Current Implementation**: Each no-show handled independently

### 6. Waiting Queue Starvation

**Problem**: Low priority tokens never get allocated

**Mitigation**:
- Time-based priority boost (not implemented)
- Maximum wait time alerts (not implemented)
- Guaranteed allocation after N days (not implemented)

**Current Implementation**: Strict priority ordering

---

## Trade-offs & Design Decisions

### 1. In-Memory vs Database Storage

**Decision**: In-memory (Map data structures)

**Pros**:
- Extremely fast operations (O(1) lookups)
- Simple implementation
- No database setup required
- Perfect for demonstration

**Cons**:
- Data lost on server restart
- No persistence
- Limited scalability
- No distributed system support

**Production Recommendation**: Use PostgreSQL with proper indexing

### 2. Synchronous vs Asynchronous Processing

**Decision**: Synchronous allocation

**Pros**:
- Immediate feedback to patient
- Simpler error handling
- Consistent state

**Cons**:
- May block on high load
- No background job processing

**Production Recommendation**: Hybrid approach with async notifications

### 3. Priority Levels

**Decision**: 5 priority levels (1-5)

**Rationale**:
- Covers all common OPD scenarios
- Not too granular (avoids complexity)
- Not too coarse (maintains fairness)
- Easily extensible

**Alternative Considered**: Dynamic priority based on wait time
- Rejected for initial version due to complexity

### 4. Bump-Down Strategy

**Decision**: Bump only lowest priority token on emergency

**Pros**:
- Minimal disruption
- Fair to higher priority patients
- Simple to implement

**Cons**:
- May still bump paid priority patients
- Could cause patient dissatisfaction

**Alternative**: Reserve emergency slots
- Rejected: Wastes capacity if no emergencies

### 5. Waiting Queue Structure

**Decision**: Single global queue, sorted by priority

**Pros**:
- Simple to manage
- Automatic priority ordering
- Easy to query

**Cons**:
- Re-sorting on every insertion (O(n log n))
- No per-doctor queues

**Optimization**: Use heap data structure (future)

---

## Performance Characteristics

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Allocate Token | O(n log n)* | O(1) |
| Cancel Token | O(n) | O(1) |
| Emergency Insert | O(n log n) | O(1) |
| Reallocate | O(m log m)** | O(1) |
| Get Token | O(1) | O(1) |
| Get Waiting Queue | O(1) | O(n) |

\* Due to waiting queue sorting  
\** Where m = waiting tokens for specific slot

**Optimization Opportunities**:
1. Use min-heap for waiting queue → O(log n) insertion
2. Index tokens by doctor/slot → O(1) filtering
3. Cache statistics → O(1) stats retrieval

---

## Failure Modes & Recovery

### 1. Server Crash

**Impact**: All data lost (in-memory storage)

**Recovery**: 
- Restart server
- Reload from backup (if implemented)
- Patients must re-book

**Production Solution**: Database persistence + transaction logs

### 2. Invalid Data

**Impact**: Corrupted state

**Prevention**:
- Input validation on all endpoints
- Type safety via TypeScript
- Boundary checks on capacities

**Recovery**: Data validation on startup

### 3. Race Conditions

**Impact**: Double allocation or capacity overflow

**Prevention**:
- Single-threaded Node.js event loop
- Atomic operations

**Production Solution**: Database row-level locking

---

## Future Enhancements

1. **Patient History Tracking**: Adjust priority based on no-show rate
2. **Time-Based Priority Boost**: Increase priority for long-waiting patients
3. **Multi-Doctor Reallocation**: Reallocate to other doctors if primary unavailable
4. **Slot Merging**: Combine under-utilized slots
5. **Predictive Capacity**: ML-based capacity recommendations
6. **Real-Time Notifications**: SMS/Push notifications for allocation changes
7. **Appointment Reminders**: Reduce no-show rate
8. **Analytics Dashboard**: Real-time OPD metrics and insights
