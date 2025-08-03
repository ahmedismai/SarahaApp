import { Router } from "express";
import {
  login,
  loginWithGmail,
  resendEmailOtp,
  signup,
  signupWithGmail,
  verifyEmail,
} from "./auth.service.js";

const router = Router();

router.post("/signup", signup);
router.post("/signup/gmail", signupWithGmail);
router.post("/login", login);
router.post("/login/gmail", loginWithGmail);
router.patch("/verify-email", verifyEmail);
router.post("/resend-email-otp", resendEmailOtp);

export default router;
