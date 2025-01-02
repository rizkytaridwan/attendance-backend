import express from "express";
import {Me,Login,LogOut} from "../controllers/auth.js";

const router = express.Router();
router.get("/me",Me);
router.post("/Login",Login);
router.delete("/Logout",LogOut);

export default router;