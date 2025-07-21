import { roleEnum, userModel } from "../../DB/models/User.model.js"
import { asyncHandler, successResponse } from "../../utils/response.js"
import { generateEncryption } from "../../utils/security/encryption.security.js";
import { comparHash, generateHash } from "../../utils/security/hash.security.js";
import { generateToken, getSignatures, tokenTypeEnum } from "../../utils/security/token.security.js";
import { create, findOne } from './../../DB/db.service.js';
import jwt from 'jsonwebtoken';

export const signup = asyncHandler(
    async (req, res , next)=>{
        const {fullName , email , password , phone} = req.body
        if (await findOne({model:userModel, filter:{email}})) {
            return next(new Error("Email exist") , {cause: 409})
        }
        const hashPassword = await generateHash({plainText: password})
        const encPhone =await generateEncryption({plainText: phone}).toString()
        const user = await create({model:userModel , data:[{fullName , email , password: hashPassword , phone:encPhone}]})
        return successResponse({res, status:201 , data:{user}})
    }
)


export const login = asyncHandler(
    async (req, res,next)=>{
            const { email , password } = req.body
            const user = await findOne({model : userModel , filter: {email}})
            if (!user) {
                return next(new Error("In-valid email or password") , {cause: 404})
            } 
            const match = await comparHash({plainText:password, hashValue:user.password})
            if (!match) {
                return next(new Error("In-valid email or password" , {cause: 404}))
            }
            const signature =  await getSignatures({
                signatureLevel:user.role != roleEnum.user ? tokenTypeEnum.System :tokenTypeEnum.bearer
            })
            const access_token = await generateToken({payload:{_id:user._id , signature:signature.accessSignature} })

            const refresh_token = await generateToken({payload:{_id:user._id} , signature:signature.refreshSignature, 
                options:{expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN)}})
            return successResponse({res, data:{access_token, refresh_token }})
        }
)

export const loginRefreshAccessToken = asyncHandler(async (req, res, next) => {
    const { refresh_token } = req.body
    if (!refresh_token) {
    return next(new Error("Refresh token is required", { cause: 400 }))
    }

    jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SIGNATURE, async (err, decoded) => {
    if (err || !decoded?._id) {
        return next(new Error("Invalid or expired refresh token", { cause: 401 }))
    }

    const user = await userModel.findById(decoded._id)
    if (!user) {
        return next(new Error("User not found", { cause: 404 }))
    }

    const newAccessToken = await generateToken({ payload: { _id: user._id } })

    return successResponse({ res, data: { access_token: newAccessToken } })
    })
})