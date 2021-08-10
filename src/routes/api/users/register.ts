import { Request, Response } from 'express';
import User from '../../../models/User';
import argon2 from 'argon2';
import crypto from 'crypto';
import sendEmail from '../../../util/email';

const registerRoute = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ email: req.body.email });
    if (user !== null) {
        res.status(400).json({
            error: 'Email taken',
        });
        return;
    }
    const passwordHash = await argon2.hash(req.body.password, {
        type: argon2.argon2id,
        parallelism: 16,
        timeCost: 1,
    });

    const emailCode = crypto.randomBytes(64).toString('hex');
    const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: passwordHash,
        registeredAt: new Date(),
        verified: false,
        emailCode: emailCode,
    });

    await newUser.save();

    console.log(`User ${req.body.email} registered`);

    sendEmail({
        to: req.body.email,
        subject: 'Verify SE Spaces Booking Email Address',
        text: `TODO your code is ${emailCode} this should be a frontend link here`,
    }).then(() => console.log(`Verification email sent to ${req.body.email}`));

    res.json({
        success: true,
    });
};

export default registerRoute;
