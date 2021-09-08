import { Request, Response } from 'express';
import Room from '../../../models/room.model';
import userModel from '../../../models/user.model';

const queryRoomsRoute = async (req: Request, res: Response): Promise<void> => {
    const id = req.query.id;
    const user = await userModel.findOne({ email: req.userEmail });

    if (id) {
        // If an id is included in the query, retrieve the room and return the room and populate sections & issues field
        const room = await Room.findOne({ _id: id, program: user!.program }).populate('sections').populate('issues');

        if (!room) {
            res.status(404).json({ err: 'No room found' });
            return;
        }

        res.status(200).json({ room });
    } else {
        // If no id is included in the query, retrieves all rooms and populate sections & issues field
        const rooms = await Room.find({ program: user!.program }).populate('sections').populate('issues');
        if (rooms.length === 0) {
            res.status(404).json({ err: 'No rooms found' });
        }
        res.status(200).json({ rooms });
    }
};

export default queryRoomsRoute;
