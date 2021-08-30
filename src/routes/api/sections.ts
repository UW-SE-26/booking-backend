import { Router } from 'express';
import querySectionRoute from './sections/querySection';
import queryBookingsRoute from './sections/queryBookings';
import createSectionRoute from './sections/createSection';
import bookSectionRoute from './sections/bookSection';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.get('/', querySectionRoute);
router.get('/bookings/active', queryBookingsRoute);
router.post('/create', authMiddleware, createSectionRoute);
router.post('/book', authMiddleware, bookSectionRoute);

export default router;
