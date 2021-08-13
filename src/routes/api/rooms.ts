import { Router } from 'express';
import queryRoomsRoute from './rooms/queryRooms';
import createRoomRoute from './rooms/createRoom';

const router = Router();

router.get('/', queryRoomsRoute);
router.post('/create', createRoomRoute);

export default router;
