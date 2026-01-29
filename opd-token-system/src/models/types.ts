export enum TokenSource {
    ONLINE = 'ONLINE',
    WALKIN = 'WALKIN',
    PAID_PRIORITY = 'PAID_PRIORITY',
    FOLLOWUP = 'FOLLOWUP',
    EMERGENCY = 'EMERGENCY'
}

export enum TokenStatus {
    ALLOCATED = 'ALLOCATED',
    WAITING = 'WAITING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW'
}

export interface TimeSlot {
    id: string;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    currentCount: number;
    allocatedTokens: string[];
}

export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    slots: TimeSlot[];
}

export interface Token {
    id: string;
    tokenNumber: number;
    doctorId: string;
    slotId: string;
    patientName: string;
    patientPhone?: string;
    source: TokenSource;
    status: TokenStatus;
    priority: number;
    createdAt: Date;
    allocatedAt?: Date;
    completedAt?: Date;
}

export interface AllocationRequest {
    doctorId: string;
    slotId: string;
    patientName: string;
    patientPhone?: string;
    source: TokenSource;
}

export interface AllocationResult {
    success: boolean;
    token?: Token;
    message: string;
    waitingPosition?: number;
}

export interface ReallocationResult {
    reallocatedCount: number;
    tokens: Token[];
}

export const PRIORITY_MAP: Record<TokenSource, number> = {
    [TokenSource.EMERGENCY]: 1,
    [TokenSource.PAID_PRIORITY]: 2,
    [TokenSource.FOLLOWUP]: 3,
    [TokenSource.ONLINE]: 4,
    [TokenSource.WALKIN]: 5
};
