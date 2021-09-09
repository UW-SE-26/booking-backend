import { Router } from 'express';
import loginRoute from './users/login';
import registerRoute from './users/register';
import verifyRoute from './users/verify';
import isAdminRoute from './users/isAdmin';
import { resetPasswordRoute, changePasswordRoute } from './users/passwordReset';
import bodyVerify from '../../middleware/bodyVerify';
import refreshTokenRoute from './users/refreshToken';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.post('/login', bodyVerify(['email', 'password']), loginRoute);
router.post('/register', bodyVerify(['name', 'email', 'password', 'program']), registerRoute);
router.post('/verify', bodyVerify(['email', 'code']), verifyRoute);
router.post('/resetPassword', bodyVerify(['email']), resetPasswordRoute);
router.post('/changePassword', bodyVerify(['email', 'password', 'code']), changePasswordRoute);
router.get('/isAdmin', authMiddleware, isAdminRoute);
router.get('/refreshToken', refreshTokenRoute);

export default router;
