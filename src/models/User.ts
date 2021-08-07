import { Schema, model } from 'mongoose';

interface User {
    name: string;
    email: string;
    password: string;
    registeredAt: Date;
    verified: boolean;
}

const userSchema = new Schema<User>({
    name: String,
    email: { type: String, required: true },
    password: String,
    registeredAt: Date,
    verified: Boolean,
});

const userModel = model<User>('User', userSchema);

export default userModel;
