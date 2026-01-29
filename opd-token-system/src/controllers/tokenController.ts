import { Request, Response } from 'express';
import { TokenAllocationEngine } from '../services/TokenAllocationEngine';
import { AllocationRequest } from '../models/types';

export class TokenController {
    constructor(private engine: TokenAllocationEngine) { }

    allocateToken = (req: Request, res: Response) => {
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

            const result = this.engine.allocateToken(request);

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
    };

    getToken = (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const token = this.engine.getToken(id);

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
    };

    cancelToken = (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = this.engine.cancelToken(id);

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
    };

    markNoShow = (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = this.engine.markNoShow(id);

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
    };

    completeToken = (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = this.engine.completeToken(id);

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
    };

    insertEmergency = (req: Request, res: Response) => {
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

            const result = this.engine.insertEmergency(request);

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
    };

    getWaitingQueue = (req: Request, res: Response) => {
        try {
            const waitingTokens = this.engine.getWaitingQueue();

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
    };

    getDoctorTokens = (req: Request, res: Response) => {
        try {
            const { doctorId } = req.params;
            const tokens = this.engine.getTokensForDoctor(doctorId);

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
    };
}
