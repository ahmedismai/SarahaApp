import { Router } from "express";
import { getNewLoginCredentials, profile, updateUser } from "./user.service.js";
import { authentication } from "../../middleware/auth.middleware.js";
import { tokenKind } from "../../utils/security/token.security.js";

const router = Router();

router.get("/", authentication(), profile);
router.get(
  "/refresh-token",
  authentication({ tokenType: tokenKind.refresh }),
  getNewLoginCredentials
);
router.patch("/update", authentication(), updateUser);

export default router;
