import { Schema, model } from 'mongoose';

interface User {
    name: string;
    email: string;
    password: string;
    registeredAt: Date;
    verified: boolean;
    emailCode: string;
    resetCode: string;
    resetAt: number;
}

const userSchema = new Schema<User>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    registeredAt: Date,
    verified: { type: Boolean, required: true },
    emailCode: String,
    resetCode: String,
    resetAt: Number,
});

const userModel = model<User>('User', userSchema);

export default userModel;
