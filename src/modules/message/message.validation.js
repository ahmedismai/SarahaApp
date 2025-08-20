import joi from "joi";
import { generaleFields } from "../../middleware/validation.middleware.js";
import { fileValidation } from "../../utils/multer/cloud.multer.js";

export const sendMessage = {
  params: joi
    .object()
    .keys({
      receiverId: generaleFields.id.required(),
    })
    .required(),
  body: joi
    .object()
    .keys({
      content: joi.string().min(2).max(200000),
    })
    .required(),
  files: joi
    .array()
    .items(
      joi.object().keys({
        fieldname: generaleFields.file.fieldname
          .valid("attachments")
          .required(),
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
    .min(0)
    .max(2),
};
