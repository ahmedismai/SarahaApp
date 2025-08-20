import express from "express";
import authController from "./modules/auth/auth.controller.js";
import userController from "./modules/user/user.controller.js";
import messageController from "./modules/message/message.controller.js";
import connectDB from "./DB/connection.db.js";
import { globalErrorHandling } from "./utils/response.js";
import path from "node:path";
import * as dotenv from "dotenv";
// dotenv.config({ path: path.join("./src/config/.env.dev") });
dotenv.config({});
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
export default async function bootstrap() {
  const app = express();
  const port = process.env.PORT || 3000;

  // const whitelist = process.env.ORIGINS.split(",");

  // app.use(async (req, res, next) => {
  //   if (!whitelist.includes(req.header("origin"))) {
  //     return next(new Error("Not Allowed By CORS", { cause: 403 }));
  //   }
  //   for (const origin of whitelist) {
  //     if (req.header("origin") == origin) {
  //       await res.header("Access-Control-Allow-Origin", origin);
  //       break;
  //     }
  //   }
  //   await res.header("Access-Control-Allow-Headers", "*");
  //   await res.header("Access-Control-Allow-Private-Network", "true");
  //   await res.header("Access-Control-Allow-Methods", "*");
  //   console.log("Origin Work");
  //   next();
  // });

  // let corsOptions = {
  //   origin: function (origin, callback) {
  //     if (whitelist.indexOf(origin) !== -1) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error("Not allowed by CORS"));
  //     }
  //   },
  // };
  app.use(cors());
  app.use(helmet());
  app.use(morgan("dev"));

  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 2000,
    standardHeaders: "draft-8",
  });

  app.use(limiter);
  app.use(express.json());
  await connectDB();

  app.get("/", (req, res) => {
    res.json({ message: "Welcome to app" });
  });
  app.use("/auth", authController);
  app.use("/user", userController);
  app.use("/message", messageController);
  app.all("{/*dummy}", (req, res) => {
    res.status(404).json({ message: "In-Valid url" });
  });

  app.use(globalErrorHandling);

  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port:::${port}`);
  });
}
