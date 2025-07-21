import { findByIdAndUpdate, findOne } from "../../DB/db.service.js";
import { userModel } from "../../DB/models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { decryptEncryption, generateEncryption } from "../../utils/security/encryption.security.js";


export const profile = asyncHandler(
    async (req, res , next ) => {
        {
            req.user.phone = await decryptEncryption({cipherText:req.user.phone})
            return successResponse({res , data:{user: req.user}})
        }
    }
)


export const updateUser = asyncHandler(async (req, res, next) => {
    const {email,  name, phone } = req.body;

    if (email && email !== req.user.email) {
        const existingUser = await findOne({model:userModel, filter:{email} });
        if (existingUser) {
        return next(new Error("This email is already in use", { cause: 409 }));
        }
        }
        const updatedUser = await findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        data: {
        ...(email && {email}),
        ...(name && { name }),
        ...(phone && { phone: generateEncryption({ plainText: phone }) }),
        },
        select: "-password", 
    });

    if (!updatedUser) {
        return next(new Error("User not found", { cause: 404 }));
    }

    return successResponse({ res, data: { user: updatedUser } });
});