import { Request, Response } from 'express';
import { TokenAllocationEngine } from '../services/TokenAllocationEngine';

export class DoctorController {
    constructor(private engine: TokenAllocationEngine) { }

    createDoctor = (req: Request, res: Response) => {
        try {
            const { name, specialization } = req.body;

            if (!name || !specialization) {
                return res.status(400).json({
                    error: 'Name and specialization are required'
                });
            }

            const doctor = this.engine.addDoctor(name, specialization);

            res.status(201).json({
                success: true,
                data: doctor,
                message: 'Doctor registered successfully'
            });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    getAllDoctors = (req: Request, res: Response) => {
        try {
            const doctors = this.engine.getAllDoctors();

            res.status(200).json({
                success: true,
                data: doctors,
                count: doctors.length
            });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    getDoctor = (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const doctor = this.engine.getDoctor(id);

            if (!doctor) {
                return res.status(404).json({
                    error: 'Doctor not found'
                });
            }

            res.status(200).json({
                success: true,
                data: doctor
            });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    addSlot = (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startTime, endTime, maxCapacity } = req.body;

            if (!startTime || !endTime || !maxCapacity) {
                return res.status(400).json({
                    error: 'startTime, endTime, and maxCapacity are required'
                });
            }

            if (maxCapacity <= 0) {
                return res.status(400).json({
                    error: 'maxCapacity must be greater than 0'
                });
            }

            const slot = this.engine.addSlot(id, startTime, endTime, maxCapacity);

            if (!slot) {
                return res.status(404).json({
                    error: 'Doctor not found'
                });
            }

            res.status(201).json({
                success: true,
                data: slot,
                message: 'Time slot added successfully'
            });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    updateSlotCapacity = (req: Request, res: Response) => {
        try {
            const { doctorId, slotId } = req.params;
            const { maxCapacity } = req.body;

            if (!maxCapacity || maxCapacity <= 0) {
                return res.status(400).json({
                    error: 'Valid maxCapacity is required'
                });
            }

            const success = this.engine.updateSlotCapacity(doctorId, slotId, maxCapacity);

            if (!success) {
                return res.status(404).json({
                    error: 'Doctor or slot not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Slot capacity updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    getDoctorStats = (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const doctor = this.engine.getDoctor(id);

            if (!doctor) {
                return res.status(404).json({
                    error: 'Doctor not found'
                });
            }

            const stats = this.engine.getDoctorStats(id);

            res.status(200).json({
                success: true,
                data: {
                    doctor: {
                        id: doctor.id,
                        name: doctor.name,
                        specialization: doctor.specialization
                    },
                    stats
                }
            });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
