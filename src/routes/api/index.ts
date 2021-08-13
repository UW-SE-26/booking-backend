import { Router } from 'express';
import userRoutes from './users';
import roomRoutes from './rooms';

const router = Router();

router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);

router.get('/', (req, res) => {
    res.send('Hello world!');
});

export default router;
