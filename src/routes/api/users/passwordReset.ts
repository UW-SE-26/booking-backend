import { Request, Response } from 'express';
import User from '../../../models/user.model';
import argon2 from 'argon2';
import sendEmail from '../../../util/email';
import crypto from 'crypto';

export async function resetPasswordRoute(req: Request, res: Response): Promise<void> {
    const user = await User.findOne({ email: req.body.email });
    if (user === null || !user.websiteUser) {
        res.status(400).json({
            error: 'User not found or this endpoint does not support their account type',
        });
        return;
    }

    const emailCode = crypto.randomBytes(8).toString('hex');
    user.resetCode = emailCode;
    user.resetAt = Date.now();

    await user.save();

    sendEmail({
        to: req.body.email,
        subject: 'Reset your password',
        text: `Your password reset code is ${emailCode}. If you didn't request a password reset, then please disregard this message. TODO frontend link here`,
    }).then(() => console.log(`Reset code sent to ${req.body.email}`));

    res.json({
        success: true,
    });
}

export async function changePasswordRoute(req: Request, res: Response): Promise<void> {
    const user = await User.findOne({ email: req.body.email });
    if (user === null) {
        res.status(400).json({
            error: 'User not found',
        });
        return;
    }
    if (user.resetCode !== req.body.code || user.resetCode === '' || user.resetAt === 0) {
        res.status(400).json({
            error: 'Invalid reset (the code is invalid or the user has not requested a reset)',
        });
        return;
    }

    if ((Date.now() - user.resetAt) / 1000 / 60 / 60 >= 1) {
        //if it's been longer than an hour since reset
        res.status(403).json({
            error: 'Reset code expired',
        });
        user.resetCode = '';
        user.resetAt = 0;
        await user.save();
        return;
    }

    user.password = await argon2.hash(req.body.password, {
        type: argon2.argon2id,
        parallelism: 16,
        timeCost: 1,
    });
    await user.save();

    res.json({
        success: true,
    });
}
