import express from "express";
import {getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from "../controllers/Users.js";
import { VerifyUser , AdminOnly } from "../middleware/AuthUser.js";
import upload from "../middleware/upload.js";

const router = express.Router();
router.get("/users", VerifyUser, AdminOnly, upload.single("image"),getUsers);
router.get("/users/:id",VerifyUser, AdminOnly, upload.single("image"),getUserById);
router.post("/users",VerifyUser, AdminOnly,upload.single("image"), createUser);
router.patch("/users/:id", VerifyUser, AdminOnly, upload.single('image'), updateUser);
router.delete("/users/:id",VerifyUser, AdminOnly, deleteUser);

export default router;