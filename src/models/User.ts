import { Schema, model, connect, Model } from 'mongoose';

interface User {
    name: string; 
    email: string; 
    password: string; 
    registeredAt: Date; 
    verified: Boolean; 
}

const userSchema = new Schema<User>({ 
    name: String, 
    email: { type: String, required: true }, 
    password: String,
    registeredAt: Date, 
    verified: Boolean
});

const userModel = model<User>('User', userSchema); 

export default userModel; 