import { Request, Response } from 'express';
import User from '../../../models/User';

const verifyRoute = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ email: req.body.email });
    if (user === null || !user.websiteUser) {
        res.status(400).json({
            error: 'User not found or this endpoint does not support their account type',
        });
        return;
    }
    if (user.verified) {
        res.status(400).json({
            error: 'User already verified',
        });
        return;
    }
    if (user.emailCode !== req.body.code) {
        res.status(403).json({
            error: 'Invalid verification code',
        });
        return;
    }
    user.verified = true;
    await user.save();

    res.json({
        success: true,
    });
};

export default verifyRoute;
