import { Request, Response } from 'express';
import User from '../../../models/user.model';
import { publicKey, privateKey } from '../../../util/keypair';
import jwtVerify from 'jose/jwt/verify';
import SignJWT from 'jose/jwt/sign';

const refreshTokenRoute = async (req: Request, res: Response): Promise<void> => {
    const refresh = req.cookies.refresh;
    try {
        const { payload } = await jwtVerify(refresh, publicKey); //verify not expired

        const user = await User.findOne({ email: payload.sub as string });

        if (user!.refresh !== refresh) {
            res.status(403).json({ err: 'Refresh token invalid (did it expire?)' });
            return;
        }

        const jwt = await new SignJWT({})
            .setProtectedHeader({
                alg: 'EdDSA',
            })
            .setIssuedAt()
            .setIssuer('SE Spaces Booking')
            .setAudience('SE Spaces Booking Auth')
            .setSubject(req.userEmail)
            .setExpirationTime('5m')
            .sign(privateKey);

        res.status(200).json({
            success: true,
            token: jwt,
        });
    } catch (err) {
        res.status(403).json({ err: 'Refresh token invalid (did it expire?)' });
    }
};

export default refreshTokenRoute;
