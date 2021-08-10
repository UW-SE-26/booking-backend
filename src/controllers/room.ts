import { Request, Response } from 'express';
import Room from '../models/Room';

export async function createRoom(req: Request, res: Response) {
    const { name, schedule, closed } = req.body;
    if (typeof name !== 'string' || typeof closed !== 'boolean' || !Array.isArray(schedule)) {
        res.status(400).json({ err: 'validation failed' });
        return;
    }
    for (const day of schedule) {
        const expectedKeys = ['dateOfWeek', 'start', 'end'];
        for (const key in day) {
            if (!expectedKeys.includes(key)) {
                res.status(400).json({ err: 'validation failed' });
                return;
            }
        }
    }
    const room = new Room({
        name,
        schedule,
        closed,
    });
    await room.save().catch((err) => {
        res.status(400).json({ err });
        return;
    });
    res.status(201).json({ room });
}

export async function queryRoom(req: Request, res: Response) {
    const id = req.query.id;
    if (id) {
        const room = await Room.findOne({ _id: id }).catch((err) => {
            res.status(404).json({ err });
            return;
        });
        res.status(200).json({ room });
    } else {
        const rooms = await Room.find({}).catch((err) => {
            res.status(400).json({ err });
            return;
        });
        res.status(200).json({ rooms });
    }
}
