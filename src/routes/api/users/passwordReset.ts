import { Request, Response, Router } from 'express';
import User from '../../../models/User';
import argon2 from 'argon2';
import sendEmail from '../../../util/email';
import crypto from 'crypto';
import bodyVerify from '../../../middleware/bodyVerify';

const router = Router();

const resetPasswordRoute = async (req: Request, res: Response) => {
    const user = await User.findOne({ email: req.body.email });
    if (user === null) {
        res.json({
            error: 'User not found',
        });
        return;
    }

    const emailCode = crypto.randomBytes(64).toString('hex');
    user.resetCode = emailCode;
    user.resetAt = Date.now();

    user.save().then(() =>
        sendEmail({
            to: req.body.email,
            subject: 'Reset your password',
            text: `TODO here's your password reset code ${emailCode} if you didn't send this then disregard, why would someone try to hack an account that books study spaces`,
        }).then(() => console.log(`Reset code sent to ${req.body.email}`))
    );

    res.json({
        success: true,
    });
};

const changePasswordRoute = async (req: Request, res: Response) => {
    const user = await User.findOne({ email: req.body.email });
    if (user === null) {
        res.json({
            error: 'User not found',
        });
        return;
    }
    if (user.resetCode !== req.body.code || user.resetCode === '' || user.resetAt === 0) {
        res.json({
            error: 'Invalid reset (the code is invalid or the user has not requested a reset)',
        });
        return;
    }

    if ((Date.now() - user.resetAt) / 1000 / 60 / 60 >= 1) {
        //if it's been longer than an hour since reset
        res.json({
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
};

router.post('/reset', bodyVerify(['email']), resetPasswordRoute);
router.post('/change', bodyVerify(['email', 'password', 'code']), changePasswordRoute);

export default router;
