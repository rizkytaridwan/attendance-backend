import express from "express";
import {getAllPayroll,generatePayroll} from "../controllers/Payroll.js";
import {VerifyUser,AdminOnly} from "../middleware/AuthUser.js";
const router = express.Router();

router.get("/payroll",VerifyUser,AdminOnly,getAllPayroll);
router.post("/generate-payroll",VerifyUser,AdminOnly, generatePayroll);

export default router;