import { Router } from 'express';
import queryRoomsRoute from './rooms/queryRooms';
import createRoomRoute from './rooms/createRoom';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.get('/', authMiddleware, queryRoomsRoute);
router.post('/create', authMiddleware, createRoomRoute);

export default router;
