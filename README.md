# OPD Token Allocation Engine

A comprehensive token allocation system for hospital OPD (Outpatient Department) that supports elastic capacity management, priority-based queuing, and dynamic reallocation.

## Features

- **Priority-Based Allocation**: 5-tier priority system (Emergency > Paid Priority > Follow-up > Online > Walk-in)
- **Dynamic Reallocation**: Automatic reallocation from waiting queue on cancellations/no-shows
-  **Emergency Insertion**: Emergency patients can bump lower priority tokens
-  **Elastic Capacity**: Adjust slot capacity on-the-fly with automatic reallocation
-  **Hard Limit Enforcement**: Strict capacity constraints per time slot
-  **Multiple Token Sources**: Online booking, walk-in, paid priority, follow-up, emergency
-  **Comprehensive API**: RESTful endpoints for all operations
-  **Edge Case Handling**: Robust handling of real-world scenarios

## Quick Start

### Installation

```bash
cd opd-token-system
npm install
```

### Run the Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

### Run the Simulation

```bash
npm run simulate
```

This runs a comprehensive simulation of one OPD day with 3 doctors, demonstrating all features.

## API Endpoints

### Doctor Management
- `POST /api/doctors` - Register a doctor
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors/:id/slots` - Add time slot
- `PUT /api/doctors/:doctorId/slots/:slotId` - Update slot capacity
- `GET /api/doctors/:id/stats` - Get doctor statistics

### Token Management
- `POST /api/tokens/allocate` - Allocate a token
- `POST /api/tokens/emergency` - Insert emergency token
- `GET /api/tokens/:id` - Get token details
- `DELETE /api/tokens/:id` - Cancel token
- `POST /api/tokens/:id/no-show` - Mark as no-show
- `POST /api/tokens/:id/complete` - Mark as completed
- `GET /api/tokens/waiting` - Get waiting queue
- `GET /api/doctors/:doctorId/tokens` - Get doctor's tokens

## Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Algorithm Design](docs/ALGORITHM_DESIGN.md) - Detailed algorithm explanation

## Project Structure

```
opd-token-system/
├── src/
│   ├── models/
│   │   └── types.ts              # Data models and interfaces
│   ├── services/
│   │   └── TokenAllocationEngine.ts  # Core business logic
│   ├── controllers/
│   │   ├── doctorController.ts   # Doctor endpoints
│   │   └── tokenController.ts    # Token endpoints
│   ├── routes/
│   │   └── index.ts              # API routes
│   └── server.ts                 # Express server
├── simulation/
│   └── opdSimulation.ts          # Comprehensive simulation
├── docs/
│   ├── API_DOCUMENTATION.md
│   └── ALGORITHM_DESIGN.md
├── package.json
└── tsconfig.json
```

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Storage**: In-memory (Map data structures)

## Example Usage

### Register a Doctor

```bash
curl -X POST http://localhost:3000/api/doctors \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Smith","specialization":"Cardiology"}'
```

### Add Time Slot

```bash
curl -X POST http://localhost:3000/api/doctors/{doctorId}/slots \
  -H "Content-Type: application/json" \
  -d '{"startTime":"09:00","endTime":"10:00","maxCapacity":10}'
```

### Allocate Token

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "{doctorId}",
    "slotId": "{slotId}",
    "patientName": "John Doe",
    "source": "ONLINE"
  }'
```

## Priority System

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | EMERGENCY | Life-threatening cases |
| 2 | PAID_PRIORITY | Premium service |
| 3 | FOLLOWUP | Return visits |
| 4 | ONLINE | Pre-booked appointments |
| 5 | WALKIN | Same-day walk-ins |

