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

export class TokenAllocationEngine {
    private doctors: Map<string, Doctor> = new Map();
    private tokens: Map<string, Token> = new Map();
    private waitingQueue: Token[] = [];
    private tokenCounter: number = 0;

    addDoctor(name: string, specialization: string): Doctor {
        const doctor: Doctor = {
            id: uuidv4(),
            name,
            specialization,
            slots: []
        };
        this.doctors.set(doctor.id, doctor);
        return doctor;
    }

    addSlot(doctorId: string, startTime: string, endTime: string, maxCapacity: number): TimeSlot | null {
        const doctor = this.doctors.get(doctorId);
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

    updateSlotCapacity(doctorId: string, slotId: string, newCapacity: number): boolean {
        const doctor = this.doctors.get(doctorId);
        if (!doctor) return false;

        const slot = doctor.slots.find(s => s.id === slotId);
        if (!slot) return false;

        const oldCapacity = slot.maxCapacity;
        slot.maxCapacity = newCapacity;

        if (newCapacity > oldCapacity) {
            this.reallocateWaitingTokens(doctorId, slotId);
        }

        return true;
    }

    allocateToken(request: AllocationRequest): AllocationResult {
        const doctor = this.doctors.get(request.doctorId);
        if (!doctor) {
            return { success: false, message: 'Doctor not found' };
        }

        const slot = doctor.slots.find(s => s.id === request.slotId);
        if (!slot) {
            return { success: false, message: 'Time slot not found' };
        }

        const token: Token = {
            id: uuidv4(),
            tokenNumber: ++this.tokenCounter,
            doctorId: request.doctorId,
            slotId: request.slotId,
            patientName: request.patientName,
            patientPhone: request.patientPhone,
            source: request.source,
            status: TokenStatus.WAITING,
            priority: PRIORITY_MAP[request.source],
            createdAt: new Date()
        };

        this.tokens.set(token.id, token);

        if (slot.currentCount < slot.maxCapacity) {
            return this.assignTokenToSlot(token, slot);
        }

        this.addToWaitingQueue(token);
        const position = this.getWaitingPosition(token);

        return {
            success: false,
            message: `Slot is full. Added to waiting queue.`,
            waitingPosition: position
        };
    }

    private assignTokenToSlot(token: Token, slot: TimeSlot): AllocationResult {
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

    private addToWaitingQueue(token: Token): void {
        this.waitingQueue.push(token);
        this.waitingQueue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
    }

    private getWaitingPosition(token: Token): number {
        return this.waitingQueue.findIndex(t => t.id === token.id) + 1;
    }

    cancelToken(tokenId: string): AllocationResult {
        const token = this.tokens.get(tokenId);
        if (!token) {
            return { success: false, message: 'Token not found' };
        }

        if (token.status === TokenStatus.CANCELLED || token.status === TokenStatus.COMPLETED) {
            return { success: false, message: 'Token already cancelled or completed' };
        }

        const doctor = this.doctors.get(token.doctorId);
        const slot = doctor?.slots.find(s => s.id === token.slotId);

        const wasAllocated = token.status === TokenStatus.ALLOCATED;

        token.status = TokenStatus.CANCELLED;

        if (slot && wasAllocated) {
            slot.currentCount--;
            slot.allocatedTokens = slot.allocatedTokens.filter(id => id !== tokenId);

            this.reallocateWaitingTokens(token.doctorId, token.slotId);
        } else {
            this.waitingQueue = this.waitingQueue.filter(t => t.id !== tokenId);
        }

        return {
            success: true,
            message: `Token ${token.tokenNumber} cancelled successfully`
        };
    }

    markNoShow(tokenId: string): AllocationResult {
        const token = this.tokens.get(tokenId);
        if (!token) {
            return { success: false, message: 'Token not found' };
        }

        if (token.status !== TokenStatus.ALLOCATED) {
            return { success: false, message: 'Token is not allocated' };
        }

        const doctor = this.doctors.get(token.doctorId);
        const slot = doctor?.slots.find(s => s.id === token.slotId);

        token.status = TokenStatus.NO_SHOW;

        if (slot) {
            slot.currentCount--;
            slot.allocatedTokens = slot.allocatedTokens.filter(id => id !== tokenId);

            this.reallocateWaitingTokens(token.doctorId, token.slotId);
        }

        return {
            success: true,
            message: `Token ${token.tokenNumber} marked as no-show`
        };
    }

    insertEmergency(request: AllocationRequest): AllocationResult {
        request.source = TokenSource.EMERGENCY;

        const doctor = this.doctors.get(request.doctorId);
        if (!doctor) {
            return { success: false, message: 'Doctor not found' };
        }

        const slot = doctor.slots.find(s => s.id === request.slotId);
        if (!slot) {
            return { success: false, message: 'Time slot not found' };
        }

        const token: Token = {
            id: uuidv4(),
            tokenNumber: ++this.tokenCounter,
            doctorId: request.doctorId,
            slotId: request.slotId,
            patientName: request.patientName,
            patientPhone: request.patientPhone,
            source: TokenSource.EMERGENCY,
            status: TokenStatus.WAITING,
            priority: PRIORITY_MAP[TokenSource.EMERGENCY],
            createdAt: new Date()
        };

        this.tokens.set(token.id, token);

        if (slot.currentCount < slot.maxCapacity) {
            return this.assignTokenToSlot(token, slot);
        }

        const lowestPriorityToken = this.findLowestPriorityToken(slot);

        if (lowestPriorityToken && lowestPriorityToken.priority > token.priority) {
            lowestPriorityToken.status = TokenStatus.WAITING;
            lowestPriorityToken.allocatedAt = undefined;
            slot.allocatedTokens = slot.allocatedTokens.filter(id => id !== lowestPriorityToken.id);
            this.addToWaitingQueue(lowestPriorityToken);

            return this.assignTokenToSlot(token, slot);
        }

        this.addToWaitingQueue(token);
        return {
            success: false,
            message: 'Emergency token added to waiting queue (all current tokens have equal/higher priority)',
            waitingPosition: this.getWaitingPosition(token)
        };
    }

    private findLowestPriorityToken(slot: TimeSlot): Token | null {
        let lowestPriorityToken: Token | null = null;
        let lowestPriority = -1;

        for (const tokenId of slot.allocatedTokens) {
            const token = this.tokens.get(tokenId);
            if (token && token.status === TokenStatus.ALLOCATED) {
                if (token.priority > lowestPriority) {
                    lowestPriority = token.priority;
                    lowestPriorityToken = token;
                }
            }
        }

        return lowestPriorityToken;
    }

    private reallocateWaitingTokens(doctorId: string, slotId: string): ReallocationResult {
        const doctor = this.doctors.get(doctorId);
        const slot = doctor?.slots.find(s => s.id === slotId);

        if (!slot) {
            return { reallocatedCount: 0, tokens: [] };
        }

        const reallocatedTokens: Token[] = [];

        const eligibleTokens = this.waitingQueue.filter(
            t => t.doctorId === doctorId && t.slotId === slotId
        );

        for (const token of eligibleTokens) {
            if (slot.currentCount >= slot.maxCapacity) break;

            token.status = TokenStatus.ALLOCATED;
            token.allocatedAt = new Date();
            slot.currentCount++;
            slot.allocatedTokens.push(token.id);
            reallocatedTokens.push(token);

            this.waitingQueue = this.waitingQueue.filter(t => t.id !== token.id);
        }

        return {
            reallocatedCount: reallocatedTokens.length,
            tokens: reallocatedTokens
        };
    }

    getTokensForDoctor(doctorId: string): Token[] {
        return Array.from(this.tokens.values()).filter(t => t.doctorId === doctorId);
    }

    getToken(tokenId: string): Token | undefined {
        return this.tokens.get(tokenId);
    }

    getAllDoctors(): Doctor[] {
        return Array.from(this.doctors.values());
    }

    getDoctor(doctorId: string): Doctor | undefined {
        return this.doctors.get(doctorId);
    }

    getWaitingQueue(): Token[] {
        return [...this.waitingQueue];
    }

    completeToken(tokenId: string): AllocationResult {
        const token = this.tokens.get(tokenId);
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

    getDoctorStats(doctorId: string) {
        const tokens = this.getTokensForDoctor(doctorId);

        return {
            total: tokens.length,
            allocated: tokens.filter(t => t.status === TokenStatus.ALLOCATED).length,
            waiting: tokens.filter(t => t.status === TokenStatus.WAITING).length,
            completed: tokens.filter(t => t.status === TokenStatus.COMPLETED).length,
            cancelled: tokens.filter(t => t.status === TokenStatus.CANCELLED).length,
            noShow: tokens.filter(t => t.status === TokenStatus.NO_SHOW).length,
            bySource: {
                online: tokens.filter(t => t.source === TokenSource.ONLINE).length,
                walkIn: tokens.filter(t => t.source === TokenSource.WALKIN).length,
                paidPriority: tokens.filter(t => t.source === TokenSource.PAID_PRIORITY).length,
                followUp: tokens.filter(t => t.source === TokenSource.FOLLOWUP).length,
                emergency: tokens.filter(t => t.source === TokenSource.EMERGENCY).length
            }
        };
    }
}
