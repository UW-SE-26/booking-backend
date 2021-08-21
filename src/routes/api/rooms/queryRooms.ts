import { Request, Response } from 'express';
import Room from '../../../models/Room';
import Section from '../../../models/section.model';

/**
 * Route to query all sections or individual section
 * @author Kevin Wang
 */
const queryRoomsRoute = async (req: Request, res: Response): Promise<void> => {
    const id = req.query.id;
    if (id) {
        // If an id is included in the query
        // Retrieve the room and return the room
        const room = await Room.findOne({ _id: id }).catch((error) => {
            res.status(404).json({ error });
            return;
        });
        // Temporary code to query sections
        // Plan to use .populate()
        if (room) {
            const sections = await Section.find({ roomId: room.id }).catch((error) => {
                res.status(404).json({ error });
                return;
            });
            if (sections) {
                res.status(200).json({ room, sections });
            } else {
                res.status(200).json({ room });
            }
        }
    } else {
        // If no id is included in the query
        // Retrieve all rooms
        const rooms = await Room.find({}).catch((error) => {
            res.status(400).json({ error });
            return;
        });

        // if (rooms) {
        //     for (const room of rooms) {
        //         const sections = await Section.find({ roomId: room._id }).catch((error) => {
        //             res.status(404).json({ error });
        //             return;
        //         });
        //     }
        // }
        res.status(200).json({ rooms });
    }
};

export default queryRoomsRoute;
