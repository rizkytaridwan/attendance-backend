import express from "express";
import {getSalaries,createSalaries,updateSalaries,deleteSalaries,getSalariesById} from "../controllers/Salaries.js";
import {VerifyUser,AdminOnly} from "../middleware/AuthUser.js";
const router = express.Router();

router.get("/salaries",VerifyUser,AdminOnly,getSalaries);
router.get("/salaries/:uuid",VerifyUser,AdminOnly,getSalariesById);
router.post("/salaries",VerifyUser,AdminOnly,createSalaries);
router.patch("/salaries/:uuid",VerifyUser,AdminOnly,updateSalaries);
router.delete("/salaries/:uuid",VerifyUser,AdminOnly,deleteSalaries);

export default router;