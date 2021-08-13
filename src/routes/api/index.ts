import { Router } from 'express';
import userRoutes from './users';

const router = Router();

router.use('/users', userRoutes);

router.get('/', (req, res) => {
    res.send('Hello world!');
});

export default router;
