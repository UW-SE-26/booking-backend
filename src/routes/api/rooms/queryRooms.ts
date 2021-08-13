import { Request, Response } from 'express';
import Room from '../../../models/Room';

const queryRoomsRoute = async (req: Request, res: Response): Promise<void> => {
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
};

export default queryRoomsRoute;
