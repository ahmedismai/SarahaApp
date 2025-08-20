import mongoose from "mongoose";

export let genderEnum = { Male: "Male", Female: "Female" };
export let roleEnum = { user: "User", admin: "Admin" };
export let providerEnum = { system: "system", google: "google" };
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: [
        20,
        "firstName max length is 20 char and you have entered {VALUE}",
      ],
    },
    lastName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: [
        20,
        "lastName max length is 20 char and you have entered {VALUE}",
      ],
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === providerEnum.system ? true : false;
      },
    },
    phone: {
      type: String,
      required: function () {
        return this.provider === providerEnum.system ? true : false;
      },
    },
    oldPasswords: [String],
    gender: {
      type: String,
      enum: {
        values: Object.values(genderEnum),
        message: `gender only allow ${Object.values(genderEnum)}`,
      },
      default: genderEnum.Male,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(roleEnum),
        message: `Role only allow ${Object.values(roleEnum)}`,
      },
      default: roleEnum.user,
    },

    provider: {
      type: String,
      enum: Object.values(providerEnum),
      default: providerEnum.system,
    },
    confirmEmail: Date,
    confirmEmailOtp: String,
    forgotPasswordOTP: String,
    confirmEmailOtpExpiresAt: { type: Date },
    confirmEmailOtpAttempts: { type: Number, default: 0 },
    confirmEmailOtpBanExpiresAt: { type: Date },
    lastOtpSentAt: { type: Date },
    otpRequestAttempts: { type: Number, default: 0 },
    otpRequestBanExpiresAt: { type: Date },
    picture: { secure_url: String, public_id: String },
    cover: [{ secure_url: String, public_id: String }],
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changeCredentialsTime: Date,
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

userSchema
  .virtual("fullName")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

userSchema.virtual("messages", {
  localField: "_id",
  foreignField: "receiverId",
  ref: "Message",
});

export const userModel =
  mongoose.models.User || mongoose.model("User", userSchema);
userModel.syncIndexes();
