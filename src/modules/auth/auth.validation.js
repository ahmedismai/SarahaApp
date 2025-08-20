import joi from "joi";
import { generaleFields } from "../../middleware/validation.middleware.js";

export const login = {
  body: joi
    .object()
    .keys({
      email: generaleFields.email.required(),
      password: generaleFields.password.required(),
    })
    .required()
    .options({ allowUnknown: false }),
};

export const signup = {
  body: login.body
    .append({
      fullName: generaleFields.fullName.required(),

      confirmPassword: generaleFields.confirmPassword.required(),
      phone: generaleFields.phone.required(),
    })
    .required()
    .options({ allowUnknown: false }),
};
export const confirmEmail = {
  body: joi
    .object()
    .keys({
      email: generaleFields.email.required(),
      otp: generaleFields.otp.required(),
    })
    .required()
    .options({ allowUnknown: false }),
};
export const loginWithGmail = {
  body: joi
    .object()
    .keys({
      idToken: joi.string().required(),
    })
    .required()
    .options({ allowUnknown: false }),
};

export const forgotPasswordOtp = {
  body: joi.object().keys({
    email: generaleFields.email.required(),
  }),
};
export const verifyPassword = {
  body: forgotPasswordOtp.body.append({
    otp: generaleFields.otp.required(),
  }),
};
export const resetPassword = {
  body: verifyPassword.body.append({
    password: generaleFields.password.required(),
    confirmPassword: generaleFields.confirmPassword.required(),
  }),
};
