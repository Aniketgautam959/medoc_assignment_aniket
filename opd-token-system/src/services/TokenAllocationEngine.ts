import { v4 as uuidv4 } from 'uuid';
import {
    Doctor,
    TimeSlot,
    Token,
    TokenSource,
    TokenStatus,
    AllocationRequest,
    AllocationResult,
    ReallocationResult,
    PRIORITY_MAP
} from '../models/types';

let doctors: { [key: string]: Doctor } = {};
let tokens: { [key: string]: Token } = {};
let waitingQueue: Token[] = [];
let tokenCounter = 0;

export function addDoctor(name: string, specialization: string): Doctor {
    const doctor: Doctor = {
        id: uuidv4(),
        name,
        specialization,
        slots: []
    };
    doctors[doctor.id] = doctor;
    return doctor;
}

export function addSlot(doctorId: string, startTime: string, endTime: string, maxCapacity: number): TimeSlot | null {
    const doctor = doctors[doctorId];
    if (!doctor) return null;

    const slot: TimeSlot = {
        id: uuidv4(),
        startTime,
        endTime,
        maxCapacity,
        currentCount: 0,
        allocatedTokens: []
    };

    doctor.slots.push(slot);
    return slot;
}

export function updateSlotCapacity(doctorId: string, slotId: string, newCapacity: number): boolean {
    const doctor = doctors[doctorId];
    if (!doctor) return false;

    const slot = doctor.slots.find(s => s.id === slotId);
    if (!slot) return false;

    const oldCapacity = slot.maxCapacity;
    slot.maxCapacity = newCapacity;

    if (newCapacity > oldCapacity) {
        reallocateWaitingTokens(doctorId, slotId);
    }

    return true;
}

export function allocateToken(request: AllocationRequest): AllocationResult {
    const doctor = doctors[request.doctorId];
    if (!doctor) {
        return { success: false, message: 'Doctor not found' };
    }

    const slot = doctor.slots.find(s => s.id === request.slotId);
    if (!slot) {
        return { success: false, message: 'Time slot not found' };
    }

    const token: Token = {
        id: uuidv4(),
        tokenNumber: ++tokenCounter,
        doctorId: request.doctorId,
        slotId: request.slotId,
        patientName: request.patientName,
        patientPhone: request.patientPhone,
        source: request.source,
        status: TokenStatus.WAITING,
        priority: PRIORITY_MAP[request.source],
        createdAt: new Date()
    };

    tokens[token.id] = token;

    if (slot.currentCount < slot.maxCapacity) {
        return assignTokenToSlot(token, slot);
    }

    addToWaitingQueue(token);
    const position = getWaitingPosition(token);

    return {
        success: false,
        message: `Slot is full. Added to waiting queue.`,
        waitingPosition: position
    };
}

function assignTokenToSlot(token: Token, slot: TimeSlot): AllocationResult {
    token.status = TokenStatus.ALLOCATED;
    token.allocatedAt = new Date();
    slot.currentCount++;
    slot.allocatedTokens.push(token.id);

    return {
        success: true,
        token,
        message: `Token ${token.tokenNumber} allocated successfully`
    };
}

function addToWaitingQueue(token: Token): void {
    waitingQueue.push(token);
    waitingQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
    });
}

function getWaitingPosition(token: Token): number {
    return waitingQueue.findIndex(t => t.id === token.id) + 1;
}

export function cancelToken(tokenId: string): AllocationResult {
    const token = tokens[tokenId];
    if (!token) {
        return { success: false, message: 'Token not found' };
    }

    if (token.status === TokenStatus.CANCELLED || token.status === TokenStatus.COMPLETED) {
        return { success: false, message: 'Token already cancelled or completed' };
    }

    const doctor = doctors[token.doctorId];
    const slot = doctor?.slots.find(s => s.id === token.slotId);

    const wasAllocated = token.status === TokenStatus.ALLOCATED;

    token.status = TokenStatus.CANCELLED;

    if (slot && wasAllocated) {
        slot.currentCount--;
        slot.allocatedTokens = slot.allocatedTokens.filter(id => id !== tokenId);

        reallocateWaitingTokens(token.doctorId, token.slotId);
    } else {
        waitingQueue = waitingQueue.filter(t => t.id !== tokenId);
    }

    return {
        success: true,
        message: `Token ${token.tokenNumber} cancelled successfully`
    };
}

export function markNoShow(tokenId: string): AllocationResult {
    const token = tokens[tokenId];
    if (!token) {
        return { success: false, message: 'Token not found' };
    }

    if (token.status !== TokenStatus.ALLOCATED) {
        return { success: false, message: 'Token is not allocated' };
    }

    const doctor = doctors[token.doctorId];
    const slot = doctor?.slots.find(s => s.id === token.slotId);

    token.status = TokenStatus.NO_SHOW;

    if (slot) {
        slot.currentCount--;
        slot.allocatedTokens = slot.allocatedTokens.filter(id => id !== tokenId);

        reallocateWaitingTokens(token.doctorId, token.slotId);
    }

    return {
        success: true,
        message: `Token ${token.tokenNumber} marked as no-show`
    };
}

export function insertEmergency(request: AllocationRequest): AllocationResult {
    request.source = TokenSource.EMERGENCY;

    const doctor = doctors[request.doctorId];
    if (!doctor) {
        return { success: false, message: 'Doctor not found' };
    }

    const slot = doctor.slots.find(s => s.id === request.slotId);
    if (!slot) {
        return { success: false, message: 'Time slot not found' };
    }

    const token: Token = {
        id: uuidv4(),
        tokenNumber: ++tokenCounter,
        doctorId: request.doctorId,
        slotId: request.slotId,
        patientName: request.patientName,
        patientPhone: request.patientPhone,
        source: TokenSource.EMERGENCY,
        status: TokenStatus.WAITING,
        priority: PRIORITY_MAP[TokenSource.EMERGENCY],
        createdAt: new Date()
    };

    tokens[token.id] = token;

    if (slot.currentCount < slot.maxCapacity) {
        return assignTokenToSlot(token, slot);
    }

    const lowestPriorityToken = findLowestPriorityToken(slot);

    if (lowestPriorityToken && lowestPriorityToken.priority > token.priority) {
        lowestPriorityToken.status = TokenStatus.WAITING;
        lowestPriorityToken.allocatedAt = undefined;
        slot.allocatedTokens = slot.allocatedTokens.filter(id => id !== lowestPriorityToken.id);
        addToWaitingQueue(lowestPriorityToken);

        return assignTokenToSlot(token, slot);
    }

    addToWaitingQueue(token);
    return {
        success: false,
        message: 'Emergency token added to waiting queue (all current tokens have equal/higher priority)',
        waitingPosition: getWaitingPosition(token)
    };
}

function findLowestPriorityToken(slot: TimeSlot): Token | null {
    let lowestPriorityToken: Token | null = null;
    let lowestPriority = -1;

    for (const tokenId of slot.allocatedTokens) {
        const token = tokens[tokenId];
        if (token && token.status === TokenStatus.ALLOCATED) {
            if (token.priority > lowestPriority) {
                lowestPriority = token.priority;
                lowestPriorityToken = token;
            }
        }
    }

    return lowestPriorityToken;
}

function reallocateWaitingTokens(doctorId: string, slotId: string): ReallocationResult {
    const doctor = doctors[doctorId];
    const slot = doctor?.slots.find(s => s.id === slotId);

    if (!slot) {
        return { reallocatedCount: 0, tokens: [] };
    }

    const reallocatedTokens: Token[] = [];

    const eligibleTokens = waitingQueue.filter(
        t => t.doctorId === doctorId && t.slotId === slotId
    );

    for (const token of eligibleTokens) {
        if (slot.currentCount >= slot.maxCapacity) break;

        token.status = TokenStatus.ALLOCATED;
        token.allocatedAt = new Date();
        slot.currentCount++;
        slot.allocatedTokens.push(token.id);
        reallocatedTokens.push(token);

        waitingQueue = waitingQueue.filter(t => t.id !== token.id);
    }

    return {
        reallocatedCount: reallocatedTokens.length,
        tokens: reallocatedTokens
    };
}

export function getTokensForDoctor(doctorId: string): Token[] {
    return Object.values(tokens).filter(t => t.doctorId === doctorId);
}

export function getToken(tokenId: string): Token | undefined {
    return tokens[tokenId];
}

export function getAllDoctors(): Doctor[] {
    return Object.values(doctors);
}

export function getDoctor(doctorId: string): Doctor | undefined {
    return doctors[doctorId];
}

export function getWaitingQueue(): Token[] {
    return [...waitingQueue];
}

export function completeToken(tokenId: string): AllocationResult {
    const token = tokens[tokenId];
    if (!token) {
        return { success: false, message: 'Token not found' };
    }

    if (token.status !== TokenStatus.ALLOCATED) {
        return { success: false, message: 'Token is not allocated' };
    }

    token.status = TokenStatus.COMPLETED;
    token.completedAt = new Date();

    return {
        success: true,
        message: `Token ${token.tokenNumber} marked as completed`
    };
}

export function getDoctorStats(doctorId: string) {
    const doctorTokens = getTokensForDoctor(doctorId);

    return {
        total: doctorTokens.length,
        allocated: doctorTokens.filter(t => t.status === TokenStatus.ALLOCATED).length,
        waiting: doctorTokens.filter(t => t.status === TokenStatus.WAITING).length,
        completed: doctorTokens.filter(t => t.status === TokenStatus.COMPLETED).length,
        cancelled: doctorTokens.filter(t => t.status === TokenStatus.CANCELLED).length,
        noShow: doctorTokens.filter(t => t.status === TokenStatus.NO_SHOW).length,
        bySource: {
            online: doctorTokens.filter(t => t.source === TokenSource.ONLINE).length,
            walkIn: doctorTokens.filter(t => t.source === TokenSource.WALKIN).length,
            paidPriority: doctorTokens.filter(t => t.source === TokenSource.PAID_PRIORITY).length,
            followUp: doctorTokens.filter(t => t.source === TokenSource.FOLLOWUP).length,
            emergency: doctorTokens.filter(t => t.source === TokenSource.EMERGENCY).length
        }
    };
}
