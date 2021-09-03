import { Router } from 'express';
import createBookingRoute from './bookings/createBooking';
import deleteBookingRoute from './bookings/deleteBooking';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.post('/create', authMiddleware, createBookingRoute);
router.delete('/delete', authMiddleware, deleteBookingRoute);

export default router;
