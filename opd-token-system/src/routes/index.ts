import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';
import * as tokenController from '../controllers/tokenController';

const router = Router();

router.post('/doctors', doctorController.createDoctor);
router.get('/doctors', doctorController.getAllDoctors);
router.get('/doctors/:id', doctorController.getDoctor);
router.post('/doctors/:id/slots', doctorController.addSlot);
router.put('/doctors/:doctorId/slots/:slotId', doctorController.updateSlotCapacity);
router.get('/doctors/:id/stats', doctorController.getDoctorStats);

router.post('/tokens/allocate', tokenController.allocateToken);
router.post('/tokens/emergency', tokenController.insertEmergency);
router.get('/tokens/waiting', tokenController.getWaitingQueue);
router.get('/tokens/:id', tokenController.getToken);
router.delete('/tokens/:id', tokenController.cancelToken);
router.post('/tokens/:id/no-show', tokenController.markNoShow);
router.post('/tokens/:id/complete', tokenController.completeToken);
router.get('/doctors/:doctorId/tokens', tokenController.getDoctorTokens);

export default router;
