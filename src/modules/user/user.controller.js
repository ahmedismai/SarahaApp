import { Router } from "express";
import {
  deleteAccount,
  freezeAccount,
  getNewLoginCredentials,
  logout,
  profile,
  profileCoverImage,
  profileImage,
  restoreAccount,
  shareProfile,
  updatePassword,
  updateUser,
} from "./user.service.js";
import { auth, authentication } from "../../middleware/auth.middleware.js";
import { tokenKind } from "../../utils/security/token.security.js";
import { endPoint } from "./user.authorization.js";
import * as validators from "./user.validation.js";
import { validation } from "../../middleware/validation.middleware.js";
import {
  cloudFileUpload,
  fileValidation,
} from "../../utils/multer/cloud.multer.js";

const router = Router();

router.post("/logout", authentication(), validation(validators.logout), logout);
router.get("/", auth({ accessRole: endPoint.profile }), profile);
router.get(
  "/refresh-token",
  authentication({ tokenType: tokenKind.refresh }),
  getNewLoginCredentials
);
router.get("/:userId", validation(validators.shareProfile), shareProfile);

router.patch(
  "/update",
  authentication(),
  validation(validators.updateBasicInfo),
  updateUser
);
router.delete(
  "{/:userId}/freeze-account",
  authentication(),
  validation(validators.freezeAccount),
  freezeAccount
);
router.patch(
  "/:userId/restore-account",
  auth({ accessRole: endPoint.restoreAccount }),
  validation(validators.restoreAccount),
  restoreAccount
);
router.patch(
  "/password",
  authentication(),
  validation(validators.updatePassword),
  updatePassword
);
router.patch(
  "/profile-image",
  authentication(),
  cloudFileUpload({
    validation: fileValidation.image,
  }).single("image"),
  validation(validators.profileImage),
  profileImage
);
router.patch(
  "/profile-cover-images",
  authentication(),
  cloudFileUpload({
    validation: fileValidation.image,
  }).array("images", 2),
  validation(validators.profileCoverImage),
  profileCoverImage
);
router.delete(
  "/:userId",
  auth({ accessRole: endPoint.deleteAccount }),
  validation(validators.deleteAccount),
  deleteAccount
);

export default router;
