import { Request, Response } from 'express';
import User from '../../../models/User';
import argon2 from 'argon2';
import { SignJWT } from 'jose/jwt/sign';
import { privateKey } from '../../../util/keypair';

const loginRoute = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ email: req.body.email });
    if (user === null || !user.websiteUser) {
        res.status(400).json({
            error: 'User not found or this endpoint does not support their account type',
        });
        return;
    }
    const passVerify = await argon2.verify(user.password, req.body.password);
    if (!passVerify) {
        res.status(403).json({
            error: 'Password incorrect',
        });
        return;
    }
    // Temporarily disabled verification check
    // Will be added after email verification is set up
    /* if (!user.verified) {
        res.status(403).json({
            error: 'Account not verified',
        });
        return;
    } */

    const jwt = await new SignJWT({})
        .setProtectedHeader({
            alg: 'EdDSA',
        })
        .setIssuedAt()
        .setIssuer('SE Spaces Booking')
        .setAudience('SE Spaces Booking Auth')
        .setSubject(user.email)
        .sign(privateKey);
    res.json({
        success: true,
        token: jwt,
    });
};

export default loginRoute;
