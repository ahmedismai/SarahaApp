import { Router } from "express";
import {
  forgotPasswordOtp,
  login,
  loginWithGmail,
  resendEmailOtp,
  verifyPassword,
  signup,
  signupWithGmail,
  verifyEmail,
  resetPassword,
} from "./auth.service.js";
import * as validators from "./auth.validation.js";

import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", validation(validators.signup), signup);
router.post(
  "/signup/gmail",
  validation(validators.loginWithGmail),
  signupWithGmail
);
router.post("/login", validation(validators.login), login);
router.patch(
  "/forgot-password",
  validation(validators.forgotPasswordOtp),
  forgotPasswordOtp
);
router.patch(
  "/verify-password",
  validation(validators.verifyPassword),
  verifyPassword
);
router.patch(
  "/reset-password",
  validation(validators.resetPassword),
  resetPassword
);
router.post(
  "/login/gmail",
  validation(validators.loginWithGmail),
  loginWithGmail
);
router.patch("/verify-email", validation(validators.confirmEmail), verifyEmail);
router.post("/resend-email-otp", resendEmailOtp);

export default router;
