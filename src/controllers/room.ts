import { Request, Response } from 'express';
import Room from '../models/Room';

export async function createRoom(req: Request, res: Response) {
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
}

export async function queryRoom(req: Request, res: Response) {
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
}

export * from './room';
