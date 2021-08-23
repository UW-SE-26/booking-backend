import { Request, Response } from 'express';
import Room from '../../../models/Room';

/**
 * Route to create a room
 * @author Kevin Wang
 */
const createRoomRoute = async (req: Request, res: Response): Promise<void> => {
    // Get data from request and validate data
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

    // Create room and save in the database
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
};

export default createRoomRoute;
