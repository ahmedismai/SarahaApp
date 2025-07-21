import { Router } from "express";
import { login, loginRefreshAccessToken, signup } from "./auth.service.js";

const router = Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/login/refresh", loginRefreshAccessToken)

export default router
