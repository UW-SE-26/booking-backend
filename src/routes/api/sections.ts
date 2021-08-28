import { Router } from 'express';
import querySectionRoute from './sections/querySection';
import createSectionRoute from './sections/createSection';
import bookSectionRoute from './sections/bookSection';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.get('/', querySectionRoute);
router.post('/create', authMiddleware, createSectionRoute);
router.post('/book/:id', bookSectionRoute);

export default router;
