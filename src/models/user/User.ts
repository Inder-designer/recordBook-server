import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { IUser } from "../../types/IUser";

const UserSchema = new mongoose.Schema<IUser>(
    {
        fullName: { type: String, required: true, trim: true },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, "Invalid email"],
        },

        number: {
            type: String,
            unique: true,
            sparse: true,
            validate: [validator.isMobilePhone, "Invalid phone number"],
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },

        initials: String,
        avatarUrl: String,

        isActive: { type: Boolean, default: false },
        last_active: { type: Date },

        sessionId: { type: String }, // optional if using sessions
        
        isDeleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,
    }
);

UserSchema.index({ email: 1 });

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (password: string) {
    return bcrypt.compare(password, (this as any).password);
};

export default mongoose.model<IUser>("User", UserSchema);