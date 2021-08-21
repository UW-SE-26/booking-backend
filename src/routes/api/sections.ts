import { Router } from 'express';
import querySectionRoute from './sections/querySection';
import createSectionRoute from './sections/createSection';
import authMiddleware from '../../middleware/auth/jwtVerify';

const router = Router();

router.get('/', authMiddleware, querySectionRoute);
router.post('/create', authMiddleware, createSectionRoute);

export default router;
