import { Router } from 'express';
import querySectionRoute from './sections/querySection';

const router = Router();

router.post('/:id', querySectionRoute);

export default router;
