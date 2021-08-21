import { Request, Response, NextFunction } from 'express';
import { publicKey } from '../../util/keypair';
import { jwtVerify } from 'jose/jwt/verify';

const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.headers.authorization || !(req.headers.authorization as string).toLowerCase().startsWith('bearer ')) {
        res.status(400).json({
            error: 'Missing bearer token',
        });
        return;
    }
    const jwt = (req.headers.authorization as string).substring(7); //get rid of 'bearer ' in header
    try {
        const { payload } = await jwtVerify(jwt, publicKey);
        req.userEmail = payload.sub as string;
        req.payload = payload;
        next();
    } catch (err) {
        res.status(403).json({
            error: 'Invalid bearer token',
        });
        return;
    }
};

export default authMiddleware;
