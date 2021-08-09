import { Router } from 'express';
import { createRoom, queryRoom } from '../../controllers/room';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello world!');
});

// room module routes
router.post('/rooms/create', createRoom);
router.get('/rooms', queryRoom);

export default router;
