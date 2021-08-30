import { Router } from 'express';
import loginRoute from './users/login';
import registerRoute from './users/register';
import verifyRoute from './users/verify';
import { resetPasswordRoute, changePasswordRoute } from './users/passwordReset';
import bodyVerify from '../../middleware/bodyVerify';

const router = Router();

router.post('/login', bodyVerify(['email', 'password']), loginRoute);
router.post('/register', bodyVerify(['name', 'email', 'password']), registerRoute);
router.post('/verify', bodyVerify(['email', 'code']), verifyRoute);
router.post('/resetPassword', bodyVerify(['email']), resetPasswordRoute);
router.post('/changePassword', bodyVerify(['email', 'password', 'code']), changePasswordRoute);

export default router;
