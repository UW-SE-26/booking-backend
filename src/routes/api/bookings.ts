import { Router } from 'express';
import createBookingRoute from './bookings/createBooking';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.post('/create', authMiddleware, createBookingRoute);

export default router;
