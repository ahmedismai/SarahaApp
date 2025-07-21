import { asyncHandler } from "../utils/response.js"
import { decodedToken, getSignatures, verifyToken } from "../utils/security/token.security.js";



export const authentication = () => {
    return asyncHandler(async (req, res, next) => {
    
        req.user = await decodedToken({authorization:req.headers.authorization . next}); 
        return next();
    });
};
