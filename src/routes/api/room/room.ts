import { Router } from 'express';
import { Request, Response } from 'express';
import Room from '../../../models/Room';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const id = req.query.id;
    if (id) {
        const room = await Room.findOne({ _id: id }).catch((error) => {
            res.status(404).json({ error });
            return;
        });
        res.status(200).json({ room });
    } else {
        const rooms = await Room.find({}).catch((error) => {
            res.status(400).json({ error });
            return;
        });
        res.status(200).json({ rooms });
    }
});

router.post('/create', async (req: Request, res: Response) => {
    const { name, schedule, closed } = req.body;
    if (typeof name !== 'string' || typeof closed !== 'boolean' || !Array.isArray(schedule)) {
        res.status(400).json({ error: 'validation failed, variable types are incorrect' });
        return;
    }
    for (const day of schedule) {
        const expectedKeys = ['dateOfWeek', 'start', 'end'];
        for (const key in day) {
            if (!expectedKeys.includes(key)) {
                res.status(400).json({ error: 'validation failed, schedule is formatted incorrectly' });
                return;
            }
        }
    }
    const room = new Room({
        name,
        schedule,
        closed,
    });
    await room.save().catch((error) => {
        res.status(400).json({ error });
        return;
    });
    res.status(201).json({ room });
});

export default router;
