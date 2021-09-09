import { Request, Response } from 'express';
import Room from '../../../models/room.model';
import userModel from '../../../models/user.model';

const createRoomRoute = async (req: Request, res: Response): Promise<void> => {
    // Get data from request and validate data
    const { name, schedule, closed, program, images } = req.body;

    const user = await userModel.findOne({ email: req.userEmail });
    if (!user!.admin) {
        res.status(403);
        return;
    }

    if (typeof name !== 'string' || typeof closed !== 'boolean' || !Array.isArray(schedule)) {
        res.status(400).json({ error: 'validation failed, variable types are incorrect' });
        return;
    }
    for (const day of schedule) {
        const expectedKeys = ['dayOfWeek', 'start', 'end'];
        for (const key in day) {
            if (!expectedKeys.includes(key)) {
                res.status(400).json({ error: 'validation failed, schedule is formatted incorrectly' });
                return;
            }
        }
    }

    // Create room and save in the database
    const room = new Room({
        name,
        schedule,
        closed,
        program,
        images,
    });
    await room.save();
    res.status(201).json({ room });
};

export default createRoomRoute;
