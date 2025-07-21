import  bcrypt  from 'bcryptjs';

export const generateHash = async ({plainText = "" , saltRound = process.env.SALT}={})=>{
    return bcrypt.hashSync(plainText , parseInt(saltRound))
}
export const comparHash = async ({plainText = "" , hashValue = ""}={})=>{
    return bcrypt.compareSync(plainText , hashValue)
}