import { Types } from "mongoose";
import { asyncHandler } from "../utils/response.js";
import joi from "joi";
import { genderEnum } from "../DB/models/User.model.js";

export const generaleFields = {
  fullName: joi.string().min(2).max(20),
  email: joi.string().email({
    minDomainSegments: 2,
    maxDomainSegments: 3,
    tlds: { allow: ["net", "com", "edu"] },
  }),
  password: joi
    .string()
    .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
  confirmPassword: joi.string().valid(joi.ref("password")),
  phone: joi.string().pattern(/^(002|\+2)?01[0125][0-9]{8}$/),
  otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
  gender: joi.string().valid(...Object.values(genderEnum)),
  id: joi.string().custom((value, helper) => {
    return Types.ObjectId.isValid(value) || helper.message("In-valid ObjectId");
  }),
  file: {
    fieldname: joi.string(),
    originalname: joi.string(),
    encoding: joi.string(),
    mimetype: joi.string(),
    destination: joi.string(),
    filename: joi.string(),
    path: joi.string(),
    size: joi.number(),
  },
};

export const validation = (schema) =>
  asyncHandler(async (req, res, next) => {
    const validationError = [];
    for (const key of Object.keys(schema)) {
      const validationResult = schema[key].validate(req[key], {
        abortEarly: false,
      });
      if (validationResult.error) {
        validationError.push({
          key,
          details: validationResult.error.details.map((ele) => {
            return { message: ele.message, path: ele.path[0] };
          }),
        });
      }
    }
    if (validationError.length) {
      return res
        .status(400)
        .json({ error_message: "Validation error", validationError });
    }
    return next();
  });
