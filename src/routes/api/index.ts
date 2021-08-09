import { Router } from 'express';
import Room from '../../models/Room';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello world!');
});

// room module routes
router.post('/rooms/create', async (req, res) => {
    const { name, sections, schedule, closed } = req.body;
    const room = new Room({
        name,
        sections,
        schedule,
        closed,
    });
    await room.save().catch((err) => {
        return res.status(400).json({ err });
    });
    res.status(201).json({ room });
});

router.get('/rooms', async (req, res) => {
    const id = req.query.id;
    if (id == null) {
        const rooms = await Room.find({}).catch((err) => {
            return res.status(400).json({ err });
        });
        res.status(200).json({ rooms });
    } else {
        const room = await Room.findOne({ _id: id }).catch((err) => {
            return res.status(404).json({ err });
        });
        res.status(200).json({ room });
    }
});

export default router;
