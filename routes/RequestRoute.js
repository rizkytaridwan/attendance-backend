import express from "express";
import {createRequest,approveRequest,rejectRequest,getRequests, getRequestById ,deleteRequest,getPendingRequests,getRequestBySession} from "../controllers/Request.js";
import { AdminOnly, VerifyUser } from "../middleware/AuthUser.js";
const router = express.Router();

router.post("/request",VerifyUser,createRequest);
router.get("/request",VerifyUser,AdminOnly,getRequests);
router.get("/request/:id",VerifyUser,AdminOnly,getRequestById);
router.delete("/request/:id",VerifyUser,AdminOnly,deleteRequest);
router.get("/pending-requests", VerifyUser,AdminOnly, getPendingRequests);
router.get("/request-by-session",VerifyUser,getRequestBySession);

router.patch("/approve-request/:requestId", VerifyUser, AdminOnly, approveRequest);
router.patch("/reject-request/:requestId", VerifyUser, AdminOnly, rejectRequest);
export default router;