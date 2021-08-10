import { Router } from 'express';
import loginRoute from './users/login';
import registerRoute from './users/register';
import verifyRoute from './users/verify';
import { resetPasswordRoute, changePasswordRoute } from './users/passwordReset';
import bodyVerify from '../../middleware/bodyVerify';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello world!');
});

router.post('/users/login', bodyVerify(['email', 'password']), loginRoute);
router.post('/users/register', bodyVerify(['name', 'email', 'password']), registerRoute);
router.post('/users/verify', bodyVerify(['email', 'code']), verifyRoute);
router.post('/users/resetPassword', bodyVerify(['email']), resetPasswordRoute);
router.post('/users/changePassword', bodyVerify(['email', 'password', 'code']), changePasswordRoute);

export default router;
