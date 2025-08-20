import {
  providerEnum,
  roleEnum,
  userModel,
} from "../../DB/models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { generateEncryption } from "../../utils/security/encryption.security.js";
import {
  comparHash,
  generateHash,
} from "../../utils/security/hash.security.js";
import { getLoginCredentials } from "../../utils/security/token.security.js";
import {
  create,
  findOne,
  findOneAndUpdate,
  updateOne,
} from "./../../DB/db.service.js";
import { OAuth2Client } from "google-auth-library";
import { emailEvent } from "../../utils/events/email.event.js";
import { customAlphabet } from "nanoid";

export const signup = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phone } = req.body;

  if (await findOne({ model: userModel, filter: { email } })) {
    return next(new Error("Email exist"), { cause: 409 });
  }
  const hashPassword = await generateHash({ plainText: password });
  const encPhone = await generateEncryption({ plainText: phone }).toString();
  const otp = customAlphabet(`0123456789`, 6)();
  const confirmEmailOtp = await generateHash({ plainText: otp });
  const confirmEmailOtpExpiresAt = Date.now() + 2 * 60 * 1000;

  const user = await create({
    model: userModel,
    data: [
      {
        fullName,
        email,
        password: hashPassword,
        phone: encPhone,
        confirmEmailOtp,
        confirmEmailOtpExpiresAt,
        confirmEmailOtpAttempts: 0,
        confirmEmailOtpBanExpiresAt: null,
      },
    ],
  });
  emailEvent.emit("confirmEmail", { to: email, otp: otp });
  return successResponse({ res, status: 201, data: { user } });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await findOne({
    model: userModel,
    filter: { email, provider: providerEnum.system },
  });
  if (!user) {
    return next(new Error("In-valid email or password"), { cause: 404 });
  }
  if (!user.confirmEmail) {
    return next("Please verify your account first");
  }
  if (user.deletedAt) {
    return next("This account is deleted ");
  }
  const match = await comparHash({
    plainText: password,
    hashValue: user.password,
  });
  if (!match) {
    return next(new Error("In-valid email or password", { cause: 404 }));
  }
  const credentials = await getLoginCredentials({ user });
  return successResponse({ res, data: { credentials } });
});

export const forgotPasswordOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const otp = customAlphabet("0123456789", 6)();
  const user = await findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      deletedAt: { $exists: false },
      provider: providerEnum.system,
    },
    data: {
      forgotPasswordOTP: await generateHash({ plainText: otp }),
    },
  });
  if (!user) {
    return next(new Error("In-valid account", { cause: 404 }));
  }
  emailEvent.emit("forgotPasswordOtp", {
    to: email,
    subject: "Forgot Password",
    title: "Reset-password",
    otp,
  });
  return successResponse({ res });
});

export const verifyPassword = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      deletedAt: { $exists: false },
      forgotPasswordOTP: { $exists: true },
      provider: providerEnum.system,
    },
  });
  if (!user) {
    return next(new Error("In-valid account", { cause: 404 }));
  }
  if (
    !(await comparHash({ plainText: otp, hashValue: user.forgotPasswordOTP }))
  ) {
    return next(new Error("In-valid otp", { cause: 400 }));
  }

  return successResponse({ res });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      deletedAt: { $exists: false },
      forgotPasswordOTP: { $exists: true },
      provider: providerEnum.system,
    },
  });
  if (!user) {
    return next(new Error("In-valid account", { cause: 404 }));
  }
  if (
    !(await comparHash({ plainText: otp, hashValue: user.forgotPasswordOTP }))
  ) {
    return next(new Error("In-valid otp", { cause: 400 }));
  }

  await updateOne({
    model: userModel,
    filter: {
      email,
    },
    data: {
      password: await generateHash({ plainText: password }),
      changeCredentialsTime: new Date(),
      $unset: { forgotPasswordOTP: 1 },
    },
  });
  return successResponse({ res });
});

async function verifyGoogleAccount({ idToken } = {}) {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.WEB_CLIENT_IDS.split(","),
  });
  const payload = ticket.getPayload();
  return payload;
}

export const signupWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;

  const { email, name, picture, email_verified } = await verifyGoogleAccount({
    idToken,
  });
  if (!email_verified) {
    return next(new Error("not verified account", { cause: 400 }));
  }
  const user = await findOne({
    model: userModel,
    filter: { email },
  });
  if (user) {
    if (user.provider === providerEnum.google) {
      // const credentials = await getLoginCredentials({ user });
      // return successResponse({ res, status: 200, data: { credentials } });
      return loginWithGmail(req, res, next);
    }
    return next(new Error("Email exist", { cause: 409 }));
  }
  const [newUser] = await create({
    model: userModel,
    data: [
      {
        fullName: name,
        email,
        picture,
        confirmEmail: Date.now(),
        provider: providerEnum.google,
      },
    ],
  });
  const credentials = await getLoginCredentials({ user: newUser });
  return successResponse({ res, status: 201, data: { credentials } });
});

export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;

  const { email, email_verified } = await verifyGoogleAccount({
    idToken,
  });
  if (!email_verified) {
    return next(new Error("not verified account", { cause: 400 }));
  }
  const user = await findOne({
    model: userModel,
    filter: { email, provider: providerEnum.google },
  });
  if (!user) {
    return next(
      new Error("In-valid login data or in-valid provider", { cause: 404 })
    );
  }
  const credentials = await getLoginCredentials({ user });
  return successResponse({ res, status: 200, data: { credentials } });
});

export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await findOne({
    model: userModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      confirmEmailOtp: { $exists: true },
    },
  });
  if (!user) {
    return next(
      new Error("In-valid email or already verified", { cause: 404 })
    );
  }

  if (
    user.confirmEmailOtpBanExpiresAt &&
    Date.now() < user.confirmEmailOtpBanExpiresAt
  ) {
    return next(
      new Error("Too many attempts. Try again after 5 minutes", { cause: 429 })
    );
  }

  if (Date.now() > user.confirmEmailOtpExpiresAt) {
    return next(new Error("OTP expired", { cause: 400 }));
  }

  const match = await comparHash({
    plainText: otp,
    hashValue: user.confirmEmailOtp,
  });

  if (!match) {
    let updateData = {
      confirmEmailOtpAttempts: user.confirmEmailOtpAttempts + 1,
    };

    if (updateData.confirmEmailOtpAttempts >= 5) {
      updateData.confirmEmailOtpBanExpiresAt = Date.now() + 5 * 60 * 1000;
      updateData.confirmEmailOtpAttempts = 0;
    }

    await updateOne({
      model: userModel,
      filter: { email },
      data: updateData,
    });

    return next(new Error("Invalid OTP", { cause: 400 }));
  }

  await updateOne({
    model: userModel,
    filter: { email },
    data: {
      confirmEmail: Date.now(),
      $unset: {
        confirmEmailOtp: 1,
        confirmEmailOtpExpiresAt: 1,
        confirmEmailOtpAttempts: 1,
        confirmEmailOtpBanExpiresAt: 1,
        lastOtpSentAt: 1,
        otpRequestAttempts: 1,
        otpRequestBanExpiresAt: 1,
      },
      $inc: { __v: 1 },
    },
  });

  return successResponse({ res, message: "Email verified successfully" });
});

export const resendEmailOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await findOne({
    model: userModel,
    filter: { email, confirmEmail: { $exists: false } },
  });
  if (!user) {
    return next(new Error("Invalid email or already verified", { cause: 404 }));
  }

  const now = Date.now();

  if (user.otpRequestBanExpiresAt && now < user.otpRequestBanExpiresAt) {
    const waitTime = Math.ceil((user.otpRequestBanExpiresAt - now) / 1000);
    return next(
      new Error(`Too many OTP requests. Try again after ${waitTime} seconds`, {
        cause: 429,
      })
    );
  }

  const minDelay = 2 * 60 * 1000;
  if (user.lastOtpSentAt && now - user.lastOtpSentAt.getTime() < minDelay) {
    const waitTime = Math.ceil(
      (minDelay - (now - user.lastOtpSentAt.getTime())) / 1000
    );
    return next(
      new Error(`Please wait ${waitTime} seconds before requesting a new OTP`, {
        cause: 429,
      })
    );
  }

  let newAttempts = (user.otpRequestAttempts || 0) + 1;
  let banUntil = null;

  if (newAttempts >= 5) {
    banUntil = now + 5 * 60 * 1000;
    newAttempts = 0;
  }

  const otp = customAlphabet(`0123456789`, 6)();
  const confirmEmailOtp = await generateHash({ plainText: otp });
  const confirmEmailOtpExpiresAt = now + 2 * 60 * 1000;

  await updateOne({
    model: userModel,
    filter: { email },
    data: {
      $set: {
        confirmEmailOtp,
        confirmEmailOtpExpiresAt,
        confirmEmailOtpAttempts: 0,
        confirmEmailOtpBanExpiresAt: null,
        lastOtpSentAt: now,
        otpRequestAttempts: newAttempts,
        otpRequestBanExpiresAt: banUntil,
      },
    },
  });

  emailEvent.emit("confirmEmail", { to: email, otp });

  return successResponse({
    res,
    message: "A new OTP has been sent to your email",
  });
});

// ROUTE_NODEJS
