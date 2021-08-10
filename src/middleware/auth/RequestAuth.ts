import { Request } from 'express';
import { JWTPayload } from 'jose/webcrypto/types';

export default interface RequestAuth extends Request {
    payload: JWTPayload;
    userEmail: string;
}
