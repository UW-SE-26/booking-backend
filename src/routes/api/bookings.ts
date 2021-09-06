import { Router } from 'express';
import createBookingRoute from './bookings/createBooking';
import queryBookingsRoute from './bookings/queryBookings';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.get('/', authMiddleware, queryBookingsRoute);
router.post('/create', authMiddleware, createBookingRoute);

export default router;
