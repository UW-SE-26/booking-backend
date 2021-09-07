import { Router } from 'express';
import createBookingRoute from './bookings/createBooking';
import queryBookingsRoute from './bookings/queryBookings';
import deleteBookingRoute from './bookings/deleteBooking';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.post('/', queryBookingsRoute);
router.post('/create', authMiddleware, createBookingRoute);
router.delete('/delete/:id', authMiddleware, deleteBookingRoute);

export default router;
