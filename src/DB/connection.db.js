import mongoose from "mongoose";

export default async function connectDB(){
    try {
        const uri = process.env.DB_URI
        const result = await mongoose.connect(uri, {
            serverSelectionTimeoutMS:30000
        })
        console.log(result.models)
        console.log(`DB connected successfully`);
    } catch (error) {
        console.log(`Fail to connect on DB`, error);
    }
}