import { Router } from 'express';
import createBookingRoute from './bookings/createBooking';
import editBookingRoute from './bookings/editBooking';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.post('/create', authMiddleware, createBookingRoute);
router.post('/edit', authMiddleware, editBookingRoute);

export default router;
