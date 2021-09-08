import { Router } from 'express';
import querySectionRoute from './sections/querySection';
import createSectionRoute from './sections/createSection';
import querySectionTimesRoute from './sections/querySectionTimes';
import authMiddleware from '../../middleware/jwtVerify';

const router = Router();

router.get('/:id', querySectionRoute);
router.post('/create', authMiddleware, createSectionRoute);
router.get('/querytimes', querySectionTimesRoute);

export default router;
