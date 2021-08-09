import { Request, Response } from 'express';
import Room from '../models/Room';

export async function createRoom(req: Request, res: Response) {
    const { name, schedule, closed } = req.body;
    if (typeof name === 'string' && typeof closed === 'boolean' && Array.isArray(schedule)) {
        for (const day in schedule) {
            if (typeof day !== 'string') {
                console.log(typeof day);
                return res.status(400).json({ err: 'validation failed' });
            }
        }
        const room = new Room({
            name,
            schedule,
            closed,
        });
        await room.save().catch((err) => {
            return res.status(400).json({ err });
        });
        res.status(201).json({ room });
    } else {
        return res.status(400).json({ err: 'validation failed' });
    }
}

export async function queryRoom(req: Request, res: Response) {
    const id = req.query.id;
    if (id) {
        const room = await Room.findOne({ _id: id }).catch((err) => {
            return res.status(404).json({ err });
        });
        res.status(200).json({ room });
    } else {
        const rooms = await Room.find({}).catch((err) => {
            return res.status(400).json({ err });
        });
        res.status(200).json({ rooms });
    }
}
