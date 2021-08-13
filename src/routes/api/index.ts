import { Router } from 'express';
import roomRoutes from '../api/room/room';

const router = Router();

router.use('/rooms', roomRoutes);

router.get('/', (req, res) => {
    res.send('Hello world!');
});

export default router;
