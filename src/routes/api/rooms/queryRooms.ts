import { Request, Response } from 'express';
import Room from '../../../models/room.model';

/**
 * Route to query all sections or individual section
 * @author Kevin Wang
 */
const queryRoomsRoute = async (req: Request, res: Response): Promise<void> => {
    const id = req.query.id;
    if (id) {
        // If an id is included in the query, retrieve the room and return the room and populate sections & issues field
        const room = await Room.findOne({ _id: id })
            .populate('sections')
            .populate('issues');
        res.status(200).json({ room });
    } else {
        // If no id is included in the query, retrieves all rooms and populate sections & issues field
        const rooms = await Room.find({})
            .populate('sections')
            .populate('issues');
        res.status(200).json({ rooms });
    }
};

export default queryRoomsRoute;
