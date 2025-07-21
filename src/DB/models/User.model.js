import mongoose from "mongoose";

export  let genderEnum = {Male:"Male" , Female:"Female"}
export  let roleEnum = {user:"User" , admin:"Admin"}
const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required: true, 
        minLength: 2 ,
        maxLength: [20 , "firstName max length is 20 char and you have entered {VALUE}"]
    },
    lastName:{
        type:String,
        required: true, 
        minLength: 2 ,
        maxLength: [20 , "lastName max length is 20 char and you have entered {VALUE}"]
    },
    email:{
        type:String, 
        required:true, 
        unique:true
    }, 
    password:{
        type:String, 
        required:true
    },
    gender:{
        type:String,
        enum:{values:Object.values(genderEnum) , message:`gender only allow ${Object.values(genderEnum)}`},
        default:genderEnum.Male
    },
    role:{
        type:String,
        enum:{values:Object.values(roleEnum) , message:`Role only allow ${Object.values(roleEnum)}`},
        default:genderEnum.user
    },
    phone: String,
    confirmEmail:Date 
},
{
    timestamps:true,
    toObject:{virtuals: true},
    toJSON:{virtuals:true}
}
)

userSchema.virtual("fullName").set(function (value){
    const [firstName, lastName] = value?.split(" ") || []
    this.set({firstName, lastName})
}).get(function() {
    return this.firstName + " " + this.lastName
})

export const userModel = mongoose.models.User || mongoose.model("User", userSchema)
userModel.syncIndexes()