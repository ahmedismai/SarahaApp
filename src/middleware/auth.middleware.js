import { asyncHandler } from "../utils/response.js";
import { decodedToken, tokenKind } from "../utils/security/token.security.js";

export const authentication = ({ tokenType = tokenKind.access } = {}) => {
  return asyncHandler(async (req, res, next) => {
    req.user = await decodedToken({
      authorization: req.headers.authorization,
      tokenType,
      next,
    });
    return next();
  });
};
