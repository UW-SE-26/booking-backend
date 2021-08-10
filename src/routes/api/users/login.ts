import { Request, Response, Router } from 'express';
import User from '../../../models/User';
import argon2 from 'argon2';
import bodyverify from '../../../middleware/bodyVerify';
import { SignJWT } from 'jose/jwt/sign';
import { privateKey } from '../../../util/keypair';

const router = Router();

const loginRoute = async (req: Request, res: Response) => {
    const user = await User.findOne({ email: req.body.email });
    if (user === null) {
        res.json({
            error: 'Account not found',
        });
        return;
    }
    const passVerify = await argon2.verify(user.password, req.body.password);
    if (!passVerify) {
        res.json({
            error: 'Password incorrect',
        });
        return;
    }
    if (!user.verified) {
        res.json({
            error: 'Account not verified',
        });
        return;
    }

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

router.post('/', bodyverify(['email', 'password']), loginRoute);

export default router;
