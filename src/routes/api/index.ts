import { Router } from 'express';
import userRoutes from './users';
import roomRoutes from './rooms';
import sectionRoutes from './sections';

const router = Router();

router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);
router.use('/sections', sectionRoutes);

router.get('/', (req, res) => {
    res.send('Hello world!');
});

export default router;
