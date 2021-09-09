import { Schema, model } from 'mongoose';

interface User {
    admin: boolean;
    name: string;
    email: string;
    discordId: string;
    websiteUser: boolean;
    password: string;
    registeredAt: Date;
    verified: boolean;
    emailCode: string;
    resetCode: string;
    resetAt: number;
    program: string;
}

const userSchema = new Schema<User>({
    admin: { type: Boolean, required: true, default: false },
    email: { type: String, required: true },
    discordId: String,
    websiteUser: { type: Boolean, required: true },
    /*
    Whether the account is a website (true) or discord user (false).
    If this property is true, the following fields
    are required and can be assumed to be present
    */
    name: String,
    password: String,
    registeredAt: Date,
    verified: Boolean,
    emailCode: String,
    /*
    These fields are used for password resets and are not guaranteed to be present
     */
    resetCode: String,
    resetAt: Number,
    program: {
        type: String,
        enum: ['SE', 'ECE'],
        default: 'SE',
    },
});

const userModel = model<User>('User', userSchema);

export default userModel;
