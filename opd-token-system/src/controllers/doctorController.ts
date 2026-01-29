import { Request, Response } from 'express';
import * as engine from '../services/TokenAllocationEngine';

export function createDoctor(req: Request, res: Response) {
    try {
        const { name, specialization } = req.body;

        if (!name || !specialization) {
            return res.status(400).json({
                error: 'Name and specialization are required'
            });
        }

        const doctor = engine.addDoctor(name, specialization);

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
}

export function getAllDoctors(req: Request, res: Response) {
    try {
        const doctors = engine.getAllDoctors();

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
}

export function getDoctor(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const doctor = engine.getDoctor(id);

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
}

export function addSlot(req: Request, res: Response) {
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

        const slot = engine.addSlot(id, startTime, endTime, maxCapacity);

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
}

export function updateSlotCapacity(req: Request, res: Response) {
    try {
        const { doctorId, slotId } = req.params;
        const { maxCapacity } = req.body;

        if (!maxCapacity || maxCapacity <= 0) {
            return res.status(400).json({
                error: 'Valid maxCapacity is required'
            });
        }

        const success = engine.updateSlotCapacity(doctorId, slotId, maxCapacity);

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
}

export function getDoctorStats(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const doctor = engine.getDoctor(id);

        if (!doctor) {
            return res.status(404).json({
                error: 'Doctor not found'
            });
        }

        const stats = engine.getDoctorStats(id);

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
}
