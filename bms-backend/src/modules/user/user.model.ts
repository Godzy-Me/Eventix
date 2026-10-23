import mongoose, { Schema } from "mongoose";
import { IUser } from "./user.interface";

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    phone: { type: Number },
    activateUser: { type: Boolean, default: false },
}, {
    timestamps: true,
});

export const UserModel = mongoose.model<IUser>("User", userSchema);