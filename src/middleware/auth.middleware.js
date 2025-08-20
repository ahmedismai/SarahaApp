import { asyncHandler } from "../utils/response.js";
import { decodedToken, tokenKind } from "../utils/security/token.security.js";

export const authentication = ({ tokenType = tokenKind.access } = {}) => {
  return asyncHandler(async (req, res, next) => {
    const { user, decoded } =
      (await decodedToken({
        authorization: req.headers.authorization,
        tokenType,
        next,
      })) || {};
    req.user = user;
    req.decoded = decoded;
    return next();
  });
};
export const authorization = ({ accessRole = [] } = {}) => {
  return asyncHandler(async (req, res, next) => {
    if (!accessRole.includes(req.user.role)) {
      return next(new Error("Not authorized account", { cause: 403 }));
    }
    return next();
  });
};
export const auth = ({
  tokenType = tokenKind.access,
  accessRole = [],
} = {}) => {
  return asyncHandler(async (req, res, next) => {
    const { user, decoded } =
      (await decodedToken({
        authorization: req.headers.authorization,
        tokenType,
        next,
      })) || {};
    req.user = user;
    req.decoded = decoded;
    if (!accessRole.includes(req.user.role)) {
      return next(new Error("Not authorized account", { cause: 403 }));
    }
    return next();
  });
};
