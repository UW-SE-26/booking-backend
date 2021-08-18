import { Router } from 'express';
import querySectionRoute from './sections/querySection';
import createSectionRoute from './sections/createSection';

const router = Router();

router.get('/', querySectionRoute);
router.post('/create', createSectionRoute);

export default router;
