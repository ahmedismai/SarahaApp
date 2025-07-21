import { Router } from "express";
import { profile, updateUser } from "./user.service.js";
import { authentication } from "../../middleware/auth.middleware.js";

const router = Router()

router.use(authentication())

router.get("/", profile)
router.patch("/update", updateUser)

export default router