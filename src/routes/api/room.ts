import { Router } from 'express';
import { createRoom, queryRoom } from '../../controllers/room';

const router = Router();

router.get('/', queryRoom);
router.post('/create', createRoom);

export default router;
