import { Request, Response, NextFunction, RequestHandler } from 'express';

const bodyVerify = (required: string[]): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const bodyKeys = Object.keys(req.body);
        const missing: string[] = [];
        required.forEach((r) => {
            if (!bodyKeys.includes(r)) missing.push(r);
        });
        if (missing.length > 0) {
            res.status(400).json({
                error: 'Missing fields',
                missing,
            });
            return;
        }
        next();
    };
};

export default bodyVerify;
