import jwt from "jsonwebtoken";
import { create, findById, findOne } from "../../DB/db.service.js";
import { roleEnum, userModel } from "../../DB/models/User.model.js";
import { nanoid } from "nanoid";
import { TokenModel } from "../../DB/models/Token.model.js";

export const logoutEnum = {
  signoutFromAll: "signoutFromAll",
  signout: "signout",
  stayLoggedIn: "stayLoggedIn",
};
export const tokenTypeEnum = { System: "System", Bearer: "Bearer" };
export const tokenKind = { access: "access", refresh: "refresh" };
export const generateToken = ({
  payload = {},
  signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
  options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) },
} = {}) => {
  return jwt.sign(payload, signature, options);
};
export const verifyToken = ({
  token = "",
  signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
} = {}) => {
  return jwt.verify(token, signature);
};

export const getSignatures = async ({
  signatureLevel = tokenTypeEnum.Bearer,
}) => {
  let signatures = {
    accessSignature: undefined,
    refreshSignature: undefined,
  };
  switch (signatureLevel) {
    case tokenTypeEnum.System:
      signatures.accessSignature = process.env.ACCESS_TOKEN_ADMIN_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_TOKEN_ADMIN_SIGNATURE;
      break;
    default:
      signatures.accessSignature = process.env.ACCESS_TOKEN_USER_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_TOKEN_USER_SIGNATURE;
  }

  return signatures;
};

export const decodedToken = async ({
  next,
  authorization = "",
  tokenType = tokenKind.access,
} = {}) => {
  const [bearer, token] = authorization?.split(" ") || [];
  if (!bearer || !token) {
    return next(new Error("missing token parts"));
  }

  let signature = await getSignatures({ signatureLevel: bearer });
  const decoded = await verifyToken({
    token,
    signature:
      tokenType === tokenKind.access
        ? signature.accessSignature
        : signature.refreshSignature,
  });
  if (
    decoded.jti &&
    (await findOne({ model: TokenModel, filter: { jti: decoded.jti } }))
  ) {
    return next(new Error("In-valid login credentials", { cause: 401 }));
  }
  const user = await findById({ model: userModel, id: decoded._id });
  if (!user) {
    return next(new Error("Not register account", { cause: 404 }));
  }
  if (user.changeCredentialsTime?.getTime() > decoded.iat * 1000) {
    return next(new Error("In-valid login credentials", { cause: 401 }));
  }
  return { user, decoded };
};

export const getLoginCredentials = async ({ user } = {}) => {
  let signature = await getSignatures({
    signatureLevel:
      user.role != roleEnum.user ? tokenTypeEnum.System : tokenTypeEnum.Bearer,
  });

  const jwtId = nanoid();

  const access_token = await generateToken({
    payload: { _id: user._id },
    signature: signature.accessSignature,
    options: {
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
      jwtid: jwtId,
    },
  });

  const refresh_token = await generateToken({
    payload: { _id: user._id },
    signature: signature.refreshSignature,
    options: {
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
      jwtid: jwtId,
    },
  });

  return { access_token, refresh_token };
};

export const createRevokeToken = async ({ req } = {}) => {
  await create({
    model: TokenModel,
    data: [
      {
        jti: req.decoded.jti,
        expiresIn:
          req.decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        userId: req.decoded._id,
      },
    ],
  });
  return true;
};
