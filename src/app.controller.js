import express from "express"
import authController from "./modules/auth/auth.controller.js"
import userController from "./modules/user/user.controller.js"
import connectDB from "./DB/connection.db.js"
import { globalErrorHandling } from "./utils/response.js"
import path from "node:path"
import * as dotenv from "dotenv"
dotenv.config({path:path.join('./src/config/.env.dev')})


export default async function bootstrap(){
    const app = express()
    const port = process.env.PORT || 5000
    
    app.use(express.json())
    await connectDB()
    app.use("/auth" , authController)
    app.use("/user" , userController)
    app.all("{/*dummy}", (req, res)=>{res.status(404).json({message:"In-Valid url"})})

    app.use(globalErrorHandling)

    app.listen(port, ()=>{
        console.log(`Example app listening on port:::${port} `)
    })
}