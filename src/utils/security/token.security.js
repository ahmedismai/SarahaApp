import jwt from 'jsonwebtoken';
import { findById } from '../../DB/db.service.js';
import { userModel } from '../../DB/models/User.model.js';

export const tokenTypeEnum = {System:"System" ,bearer:"Bearer"}
export const tokenType = {access:"access" ,refresh:"refresh"}
export const generateToken = ({
    payload = {},
    signature = process.env.ACCESS_TOKEN_SIGNATURE,
    options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) }
  } = {}) => {
    return jwt.sign(payload, signature, options);
  };
export const verifyToken = ({token="" , signature=process.env.ACCESS_TOKEN_SIGNATURE}={})=>{
    return jwt.verify(token , signature )
}

export const getSignatures = async({signatureLevel = tokenTypeEnum.bearer})=>{
  const signatures ={ accessSignature: undefined , refreshSignature:undefined }
  switch(signatureLevel){
    case tokenTypeEnum.System:
      signatures.accessSignature = process.env.ACCESS_TOKEN_ADMIN_SIGNATURE
      signatures.refreshSignature = process.env.REFRESH_TOKEN_ADMIN_SIGNATURE
    break;
    default:
      signatures.accessSignature = process.env.ACCESS_TOKEN_USER_SIGNATURE
      signatures.refreshSignature = process.env.REFRESH_TOKEN_USER_SIGNATURE
  }
  return signatures
}


export const decodedToken = async (authorization= "" ,tokenType=tokenType.access, next)=>{
  
    const [bearer, token]=authorization?.split(" ") || []
    if (!bearer || !token) {
        return next(new Error("missing token parts"))
    }

    let signature = await getSignatures({signatureLevel: bearer})
    const decoded =await verifyToken({token, 
      signature:
      tokenType === tokenType.access?
      signature.accessSignature : signature.refreshSignature});
    
    const user = await findById({ model: userModel, id: decoded._id }); 
    if (!user) {
        return next(new Error("Not register account", { cause: 404 }));
    }
        
        return user;
    
}