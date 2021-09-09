import { Request, Response } from 'express';
import User from '../../../models/user.model';
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

    if (!user.verified) {
        res.status(403).json({
            error: 'Account not verified',
        });
        return;
    }

    const expire = new Date().getTime() + 300000;

    const jwt = await new SignJWT({})
        .setProtectedHeader({
            alg: 'EdDSA',
        })
        .setIssuedAt()
        .setIssuer('SE Spaces Booking')
        .setAudience('SE Spaces Booking Auth')
        .setSubject(user.email)
        .setExpirationTime(expire)
        .sign(privateKey);

    const refresh = await new SignJWT({})
        .setProtectedHeader({
            alg: 'EdDSA',
        })
        .setIssuedAt()
        .setIssuer('SE Spaces Booking')
        .setAudience('SE Spaces Booking Auth')
        .setSubject(user.email)
        .setExpirationTime('1w')
        .sign(privateKey);

    user.refresh = refresh;
    await user.save();

    res.cookie('refresh', refresh, { httpOnly: true, sameSite: true /*secure: true*/ });

    res.json({
        success: true,
        token: jwt,
        expiration: expire,
    });
};

export default loginRoute;
