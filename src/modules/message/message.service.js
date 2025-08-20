import { destroyFile } from "../../utils/multer/cloudinary.js";
import { asyncHandler, successResponse } from "./../../utils/response.js";
import * as DBService from "../../DB/db.service.js";
import { userModel } from "../../DB/models/User.model.js";
import { uploadFiles } from "../../utils/multer/cloudinary.js";
import { MessageModel } from "./../../DB/models/Message.models.js";

export const sendMessage = asyncHandler(async (req, res, next) => {
  if (!req.body.content && !req.files) {
    return next(new Error("message content is required", { cause: 403 }));
  }
  const { receiverId } = req.params;

  if (
    !(await DBService.findOne({
      model: userModel,
      filter: {
        _id: receiverId,
        deleteAt: { $exists: false },
        confirmEmail: { $exists: true },
      },
    }))
  ) {
    return next(new Error("In_valid recipient account", { cause: 404 }));
  }

  const { content } = req.body;
  let attachments = [];
  if (req.files) {
    attachments = await uploadFiles({
      files: req.files,
      path: `message/${receiverId}`,
    });
  }
  const [message] = await DBService.create({
    model: MessageModel,
    data: [
      {
        content,
        attachments,
        receiverId,
        senderId: req.user?._id,
      },
    ],
  });
  return successResponse({ res, status: 201, data: { message } });
});

export const softDeleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;

  const message = await DBService.findOneAndUpdate({
    model: MessageModel,
    filter: { _id: messageId, deletedAt: null },
    data: { deletedAt: new Date() },
    options: { new: true },
  });

  if (!message) {
    return next(
      new Error("Message not found or already deleted", { cause: 404 })
    );
  }

  return successResponse({ res, data: { message } });
});

export const hardDeleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;

  const message = await DBService.findOne({
    model: MessageModel,
    filter: { _id: messageId },
  });

  if (!message) {
    return next(new Error("Message not found", { cause: 404 }));
  }

  if (message.attachments?.length) {
    for (const file of message.attachments) {
      if (file.public_id) {
        await destroyFile({ public_id: file.public_id });
      }
    }
  }

  await DBService.deleteOne({
    model: MessageModel,
    filter: { _id: messageId },
  });

  return successResponse({ res, message: "Message deleted permanently" });
});
