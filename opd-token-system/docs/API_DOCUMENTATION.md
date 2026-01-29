# OPD Token Allocation System - API Documentation

## Overview

RESTful API for managing OPD token allocation with priority-based queuing, dynamic reallocation, and elastic capacity management.

**Base URL**: `http://localhost:3000/api`

---

## Doctor Management

### Register a Doctor

**Endpoint**: `POST /api/doctors`

**Request Body**:
```json
{
  "name": "Dr. John Smith",
  "specialization": "Cardiology"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Dr. John Smith",
    "specialization": "Cardiology",
    "slots": []
  },
  "message": "Doctor registered successfully"
}
```

---

### Get All Doctors

**Endpoint**: `GET /api/doctors`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "Dr. John Smith",
      "specialization": "Cardiology",
      "slots": [...]
    }
  ],
  "count": 1
}
```

---

### Get Doctor by ID

**Endpoint**: `GET /api/doctors/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Dr. John Smith",
    "specialization": "Cardiology",
    "slots": [...]
  }
}
```

---

### Add Time Slot

**Endpoint**: `POST /api/doctors/:id/slots`

**Request Body**:
```json
{
  "startTime": "09:00",
  "endTime": "10:00",
  "maxCapacity": 10
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "slot-uuid",
    "startTime": "09:00",
    "endTime": "10:00",
    "maxCapacity": 10,
    "currentCount": 0,
    "allocatedTokens": []
  },
  "message": "Time slot added successfully"
}
```

---

### Update Slot Capacity

**Endpoint**: `PUT /api/doctors/:doctorId/slots/:slotId`

**Request Body**:
```json
{
  "maxCapacity": 15
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Slot capacity updated successfully"
}
```

**Note**: Increasing capacity automatically triggers reallocation from waiting queue.

---

### Get Doctor Statistics

**Endpoint**: `GET /api/doctors/:id/stats`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "uuid",
      "name": "Dr. John Smith",
      "specialization": "Cardiology"
    },
    "stats": {
      "total": 25,
      "allocated": 15,
      "waiting": 5,
      "completed": 3,
      "cancelled": 1,
      "noShow": 1,
      "bySource": {
        "online": 10,
        "walkIn": 8,
        "paidPriority": 3,
        "followUp": 2,
        "emergency": 2
      }
    }
  }
}
```

---

## Token Management

### Allocate Token

**Endpoint**: `POST /api/tokens/allocate`

**Request Body**:
```json
{
  "doctorId": "doctor-uuid",
  "slotId": "slot-uuid",
  "patientName": "Jane Doe",
  "patientPhone": "+1234567890",
  "source": "ONLINE"
}
```

**Token Sources**: `ONLINE`, `WALKIN`, `PAID_PRIORITY`, `FOLLOWUP`, `EMERGENCY`

**Response - Success** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "token-uuid",
    "tokenNumber": 1,
    "doctorId": "doctor-uuid",
    "slotId": "slot-uuid",
    "patientName": "Jane Doe",
    "patientPhone": "+1234567890",
    "source": "ONLINE",
    "status": "ALLOCATED",
    "priority": 4,
    "createdAt": "2026-01-29T16:30:00.000Z",
    "allocatedAt": "2026-01-29T16:30:00.000Z"
  },
  "message": "Token 1 allocated successfully"
}
```

**Response - Waiting Queue** (200 OK):
```json
{
  "success": false,
  "message": "Slot is full. Added to waiting queue.",
  "waitingPosition": 3
}
```

---

### Get Token Details

**Endpoint**: `GET /api/tokens/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "token-uuid",
    "tokenNumber": 1,
    "doctorId": "doctor-uuid",
    "slotId": "slot-uuid",
    "patientName": "Jane Doe",
    "source": "ONLINE",
    "status": "ALLOCATED",
    "priority": 4,
    "createdAt": "2026-01-29T16:30:00.000Z",
    "allocatedAt": "2026-01-29T16:30:00.000Z"
  }
}
```

---

### Cancel Token

**Endpoint**: `DELETE /api/tokens/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token 1 cancelled successfully"
}
```

**Side Effect**: Automatically reallocates from waiting queue if token was allocated.

---

### Mark as No-Show

**Endpoint**: `POST /api/tokens/:id/no-show`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token 1 marked as no-show"
}
```

**Side Effect**: Frees up slot and reallocates from waiting queue.

---

### Mark as Completed

**Endpoint**: `POST /api/tokens/:id/complete`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token 1 marked as completed"
}
```

---

### Insert Emergency Token

**Endpoint**: `POST /api/tokens/emergency`

**Request Body**:
```json
{
  "doctorId": "doctor-uuid",
  "slotId": "slot-uuid",
  "patientName": "Emergency Patient",
  "patientPhone": "+1234567890"
}
```

**Response - Success with Bump** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "token-uuid",
    "tokenNumber": 15,
    "source": "EMERGENCY",
    "status": "ALLOCATED",
    "priority": 1,
    ...
  },
  "message": "Token 15 allocated successfully"
}
```

**Behavior**: 
- If slot is full, bumps the lowest priority token to waiting queue
- Emergency tokens have highest priority (priority = 1)

---

### Get Waiting Queue

**Endpoint**: `GET /api/tokens/waiting`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "token-uuid",
      "tokenNumber": 10,
      "patientName": "Waiting Patient",
      "source": "WALKIN",
      "status": "WAITING",
      "priority": 5,
      ...
    }
  ],
  "count": 1
}
```

**Note**: Tokens are ordered by priority (ascending), then by creation time.

---

### Get Doctor's Tokens

**Endpoint**: `GET /api/doctors/:doctorId/tokens`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "token-uuid",
      "tokenNumber": 1,
      "status": "ALLOCATED",
      ...
    }
  ],
  "count": 15
}
```

---

## Data Schemas

### Token Status Values
- `ALLOCATED` - Token assigned to a slot
- `WAITING` - Token in waiting queue
- `COMPLETED` - Patient consultation completed
- `CANCELLED` - Token cancelled by patient/staff
- `NO_SHOW` - Patient did not show up

### Token Sources & Priority
| Source | Priority | Description |
|--------|----------|-------------|
| `EMERGENCY` | 1 | Emergency patients (highest) |
| `PAID_PRIORITY` | 2 | Paid priority service |
| `FOLLOWUP` | 3 | Follow-up appointments |
| `ONLINE` | 4 | Online bookings |
| `WALKIN` | 5 | Walk-in patients (lowest) |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "doctorId, slotId, patientName, and source are required"
}
```

### 404 Not Found
```json
{
  "error": "Doctor not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message here"
}
```

---

## Health Check

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "OK",
  "timestamp": "2026-01-29T16:30:00.000Z"
}
```
