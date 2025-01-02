import express from 'express';
import { createOvertime, getAllOvertime, getOvertimeByUuid, updateOvertime, deleteOvertime , approveOvertime , rejectOvertime , getUserOvertimeHistory, getPendingOvertime } from '../controllers/Overtime.js';
import {VerifyUser, AdminOnly} from '../middleware/AuthUser.js';
const router = express.Router();

router.post('/overtime', VerifyUser, createOvertime);
router.get('/overtime', VerifyUser, AdminOnly, getAllOvertime);
router.get('/overtime/:uuid', VerifyUser, AdminOnly,getOvertimeByUuid);
router.put('/overtime/:uuid', VerifyUser, AdminOnly, updateOvertime);
router.delete('/overtime/:uuid', VerifyUser, AdminOnly, deleteOvertime);
router.put('/approve-overtime/:uuid', VerifyUser, AdminOnly, approveOvertime);
router.put('/reject-overtime/:uuid', VerifyUser, AdminOnly, rejectOvertime);
router.get('/overtime-history', VerifyUser, getUserOvertimeHistory);
router.get('/pending-overtime', VerifyUser, AdminOnly, getPendingOvertime);

export default router;
