import joi from "joi";
import { generaleFields } from "../../middleware/validation.middleware.js";
import { logoutEnum } from "../../utils/security/token.security.js";
import { fileValidation } from "../../utils/multer/cloud.multer.js";

export const logout = {
  body: joi
    .object()
    .keys({
      flag: joi
        .string()
        .valid(...Object.values(logoutEnum))
        .default(logoutEnum.stayLoggedIn),
    })
    .required(),
};
export const shareProfile = {
  params: joi.object().keys({
    userId: generaleFields.id.required(),
  }),
};

export const updateBasicInfo = {
  body: joi
    .object()
    .keys({
      fullName: generaleFields.fullName,
      phone: generaleFields.phone,
      gender: generaleFields.gender,
    })
    .required(),
};
export const updatePassword = {
  body: logout.body
    .append({
      oldPassword: generaleFields.password.required(),
      password: generaleFields.password.not(joi.ref("oldPassword")).required(),
      confirmPassword: generaleFields.confirmPassword.required(),
    })
    .required(),
};
export const freezeAccount = {
  params: joi.object().keys({
    userId: generaleFields.id,
  }),
};
export const restoreAccount = {
  params: joi.object().keys({
    userId: generaleFields.id.required(),
  }),
};
export const deleteAccount = {
  params: joi.object().keys({
    userId: generaleFields.id.required(),
  }),
};

export const profileImage = {
  file: joi.object().keys({
    fieldname: generaleFields.file.fieldname.valid("image").required(),
    originalname: generaleFields.file.originalname.required(),
    encoding: generaleFields.file.encoding.required(),
    mimetype: generaleFields.file.mimetype
      .valid(...fileValidation.image)
      .required(),
    destination: generaleFields.file.destination.required(),
    filename: generaleFields.file.filename.required(),
    path: generaleFields.file.path.required(),
    size: generaleFields.file.size.required(),
  }),
};
export const profileCoverImage = {
  files: joi
    .array()
    .items(
      joi.object().keys({
        fieldname: generaleFields.file.fieldname.valid("images").required(),
        originalname: generaleFields.file.originalname.required(),
        encoding: generaleFields.file.encoding.required(),
        mimetype: generaleFields.file.mimetype
          .valid(...fileValidation.image)
          .required(),
        destination: generaleFields.file.destination.required(),
        filename: generaleFields.file.filename.required(),
        path: generaleFields.file.path.required(),
        size: generaleFields.file.size.required(),
      })
    )
    .min(1)
    .max(2)
    .required(),
};
