import express from "express";
import {
    createDeduction,
    getAllDeductions,
    getDeductionById,
    updateDeduction,
    deleteDeduction,
    getDeductionsInMonthByUserId,
    getDeductionBySession
}
from "../controllers/Deductions.js";
import { VerifyUser, AdminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.post("/deductions", VerifyUser, AdminOnly, createDeduction);
router.get("/deductions", VerifyUser, AdminOnly, getAllDeductions);
router.get("/deductions/:uuid", VerifyUser, AdminOnly, getDeductionById);
router.put("/deductions/:uuid", VerifyUser, AdminOnly, updateDeduction);
router.delete("/deductions/:uuid", VerifyUser, AdminOnly, deleteDeduction);
router.post("/deductions-in-month", VerifyUser, getDeductionsInMonthByUserId);
router.get("/deductions-by-session", VerifyUser, getDeductionBySession);

export default router;