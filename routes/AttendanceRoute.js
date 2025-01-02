import express from "express";
import {
    createAttendance,
    getAttendance,
    getAttendanceById,
    deleteAttendance,
    updateAttendance,
    getAbsentUsers,
    getAttendanceBySession,
    getAttendanceInMonthByUserId,
    getAttendanceInMonth,
    getAttendanceStatus,
    processAbsentEmployees,
    getUserDeductions
} from "../controllers/Attendance.js";
import upload from "../middleware/upload.js";
import { AdminOnly, VerifyUser } from "../middleware/AuthUser.js";
const router = express.Router();



router.get("/attendance",upload.fields([{ name: "checkInImage", maxCount: 1 }, { name: "checkOutImage", maxCount: 1 }]),VerifyUser,AdminOnly,getAttendance);
router.get("/attendance/:id",upload.fields([{ name: "checkInImage", maxCount: 1 }, { name: "checkOutImage", maxCount: 1 }]),VerifyUser,AdminOnly,getAttendanceById);
router.post(
    "/attendance",
    upload.fields([{ name: "checkInImage", maxCount: 1 }, { name: "checkOutImage", maxCount: 1 }]),
    VerifyUser,createAttendance
  );
router.delete("/attendance/:id",VerifyUser,AdminOnly,deleteAttendance);
router.patch("/attendance/:id",VerifyUser,AdminOnly,updateAttendance);
router.get("/absent",VerifyUser,AdminOnly,getAbsentUsers);
router.get("/attendance-by-session",VerifyUser,getAttendanceBySession);
router.post("/attendance-by-user",VerifyUser,getAttendanceInMonthByUserId);
router.post("/attendance-in-month",VerifyUser,getAttendanceInMonth);
router.get("/attendance-status",VerifyUser,getAttendanceStatus);
router.post("/process-absent", processAbsentEmployees);
router.get("/deductions/:userId", getUserDeductions);

export default router;
