import { Request, Response } from 'express';
import * as engine from '../services/TokenAllocationEngine';
import { AllocationRequest } from '../models/types';

export function allocateToken(req: Request, res: Response) {
    try {
        const { doctorId, slotId, patientName, patientPhone, source } = req.body;

        if (!doctorId || !slotId || !patientName || !source) {
            return res.status(400).json({
                error: 'doctorId, slotId, patientName, and source are required'
            });
        }

        const request: AllocationRequest = {
            doctorId,
            slotId,
            patientName,
            patientPhone,
            source
        };

        const result = engine.allocateToken(request);

        if (result.success) {
            return res.status(201).json({
                success: true,
                data: result.token,
                message: result.message
            });
        } else {
            return res.status(200).json({
                success: false,
                message: result.message,
                waitingPosition: result.waitingPosition
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export function getToken(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const token = engine.getToken(id);

        if (!token) {
            return res.status(404).json({
                error: 'Token not found'
            });
        }

        res.status(200).json({
            success: true,
            data: token
        });
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export function cancelToken(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const result = engine.cancelToken(id);

        if (!result.success) {
            return res.status(400).json({
                error: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export function markNoShow(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const result = engine.markNoShow(id);

        if (!result.success) {
            return res.status(400).json({
                error: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export function completeToken(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const result = engine.completeToken(id);

        if (!result.success) {
            return res.status(400).json({
                error: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export function insertEmergency(req: Request, res: Response) {
    try {
        const { doctorId, slotId, patientName, patientPhone } = req.body;

        if (!doctorId || !slotId || !patientName) {
            return res.status(400).json({
                error: 'doctorId, slotId, and patientName are required'
            });
        }

        const request: AllocationRequest = {
            doctorId,
            slotId,
            patientName,
            patientPhone,
            source: 'EMERGENCY' as any
        };

        const result = engine.insertEmergency(request);

        if (result.success) {
            return res.status(201).json({
                success: true,
                data: result.token,
                message: result.message
            });
        } else {
            return res.status(200).json({
                success: false,
                message: result.message,
                waitingPosition: result.waitingPosition
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export function getWaitingQueue(req: Request, res: Response) {
    try {
        const waitingTokens = engine.getWaitingQueue();

        res.status(200).json({
            success: true,
            data: waitingTokens,
            count: waitingTokens.length
        });
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export function getDoctorTokens(req: Request, res: Response) {
    try {
        const { doctorId } = req.params;
        const tokens = engine.getTokensForDoctor(doctorId);

        res.status(200).json({
            success: true,
            data: tokens,
            count: tokens.length
        });
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
