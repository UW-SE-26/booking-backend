import { Router } from 'express';
import querySectionRoute from './sections/querySection';
import createSectionRoute from './sections/createSection';
import querySectionTimesRoute from './sections/querySectionTimes';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.get('/:id', authMiddleware, querySectionRoute);
router.post('/create', authMiddleware, createSectionRoute);
router.get('/queryTimes', authMiddleware, querySectionTimesRoute);

export default router;
