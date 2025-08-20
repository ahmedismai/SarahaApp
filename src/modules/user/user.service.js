import {
  create,
  deleteOne,
  findById,
  findByIdAndUpdate,
  findOne,
  findOneAndUpdate,
  updateOne,
} from "../../DB/db.service.js";
import { TokenModel } from "../../DB/models/Token.model.js";
import { roleEnum, userModel } from "../../DB/models/User.model.js";
import {
  cloud,
  deleteFolderByPrefix,
  deleteRecourse,
  destroyFile,
  uploadFile,
  uploadFiles,
} from "../../utils/multer/cloudinary.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import {
  decryptEncryption,
  generateEncryption,
} from "../../utils/security/encryption.security.js";
import {
  comparHash,
  generateHash,
} from "../../utils/security/hash.security.js";
import {
  createRevokeToken,
  getLoginCredentials,
  logoutEnum,
} from "../../utils/security/token.security.js";

export const logout = asyncHandler(async (req, res, next) => {
  {
    let status = 200;
    const { flag } = req.body;
    switch (flag) {
      case logoutEnum.signoutFromAll:
        await updateOne({
          model: userModel,
          filter: { _id: req.decoded._id },
          data: {
            changeCredentialsTime: new Date(),
          },
        });
        break;

      default:
        await createRevokeToken({ req });
        status = 201;
        break;
    }

    return successResponse({
      res,
      status,
      data: {},
    });
  }
});
export const profile = asyncHandler(async (req, res, next) => {
  {
    const user = await findById({
      model: userModel,
      id: req.user._id,
      populate: [{ path: "messages" }],
    });
    user.phone = await decryptEncryption({ cipherText: req.user.phone });
    return successResponse({ res, data: { user } });
  }
});
export const shareProfile = asyncHandler(async (req, res, next) => {
  {
    const { userId } = req.params;
    const user = await findOne({
      model: userModel,
      filter: {
        _id: userId,
        confirmEmail: { $exists: true },
      },
    });
    return user
      ? successResponse({ res, data: { user } })
      : next(new Error("In-valid account ", { cause: 404 }));
  }
});

export const getNewLoginCredentials = asyncHandler(async (req, res, next) => {
  {
    const credentials = await getLoginCredentials({ user: req.user });
    return successResponse({ res, data: { credentials } });
  }
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { fullName, phone, gender } = req.body;

  if (!fullName && !gender && !phone) {
    return next(new Error("No data provided to update", { cause: 400 }));
  }
  const updatedUser = await findByIdAndUpdate({
    model: userModel,
    id: req.user._id,
    data: {
      ...(fullName && { fullName }),
      ...(gender && { gender }),
      ...(phone && { phone: generateEncryption({ plainText: phone }) }),
    },
    select: "-password",
  });

  if (!updatedUser) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({ res, data: { user: updatedUser } });
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, password, flag } = req.body;

  if (
    !(await comparHash({
      plainText: oldPassword,
      hashValue: req.user.password,
    }))
  ) {
    return next(new Error("In-valid old password", { cause: 400 }));
  }
  if (req.user.oldPasswords?.length) {
    for (const hashPassword of req.user.oldPasswords) {
      if (
        await comparHash({
          plainText: password,
          hashValue: hashPassword,
        })
      ) {
        return next(new Error("this is used before ", { cause: 400 }));
      }
    }
  }

  let updateData = {};
  switch (flag) {
    case logoutEnum.signoutFromAll:
      updateData.changeCredentialsTime = new Date();
      break;
    case logoutEnum.signout:
      await createRevokeToken({ req });
    default:
      break;
  }
  const updatedUser = await findByIdAndUpdate({
    model: userModel,
    id: req.user._id,
    data: {
      password: await generateHash({ plainText: password }),
      ...updateData,
      $push: { oldPasswords: req.user.password },
    },
  });

  if (!updatedUser) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({ res, data: { user: updatedUser } });
});

export const freezeAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId && req.user.role !== roleEnum.admin) {
    return next(new Error("No authorized account", { cause: 403 }));
  }

  const User = await findOneAndUpdate({
    model: userModel,
    filter: {
      _id: userId || req.user._id,
      deletedAt: { $exists: false },
    },
    data: {
      deletedAt: Date.now(),
      deletedBy: req.user._id,
      changeCredentialsTime: new Date(),
      $unset: {
        restoreAt: 1,
        restoreBy: 1,
      },
    },
    select: "-password",
  });

  if (!User) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({ res, data: { user: User } });
});

export const deleteAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const User = await deleteOne({
    model: userModel,
    filter: {
      _id: userId,
      deletedAt: { $exists: true },
    },
  });

  if (!User.deleteCount) {
    return next(new Error("User not found", { cause: 404 }));
  }

  if (User.deleteCount) {
    await deleteFolderByPrefix({ prefix: `user/${userId}` });
  }
  return successResponse({ res, data: { user: User } });
});

export const restoreAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const User = await findOneAndUpdate({
    model: userModel,
    filter: {
      _id: userId,
      deletedAt: { $exists: true },
      deletedBy: { $ne: userId },
    },
    data: {
      $unset: {
        deletedAt: 1,
        deletedBy: 1,
      },
      restoreAt: Date.now(),
      restoreBy: req.user._id,
    },
  });

  if (!User) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({ res, data: { user: User } });
});

export const profileImage = asyncHandler(async (req, res, next) => {
  const { secure_url, public_id } = await uploadFile({
    file: req.file,
    path: `user/${req.user._id}`,
  });
  const user = await findOneAndUpdate({
    model: userModel,
    filter: {
      _id: req.user._id,
    },
    data: {
      picture: { secure_url, public_id },
    },
    options: {
      new: false,
    },
  });

  if (user?.picture?.public_id) {
    await destroyFile({ public_id: user.picture.public_id });
  }
  return successResponse({ res, data: { user } });
});
export const profileCoverImage = asyncHandler(async (req, res, next) => {
  const attachments = await uploadFiles({
    files: req.files,
    path: `user/${req.user._id}/cover`,
  });
  const user = await findOneAndUpdate({
    model: userModel,
    filter: {
      _id: req.user._id,
    },
    data: {
      cover: attachments,
    },
    options: { new: false },
  });
  if (user?.cover?.length) {
    await deleteRecourse({
      public_ids: user.cover.map((ele) => ele.public_id),
    });
  }
  return successResponse({ res, data: { user } });
});
