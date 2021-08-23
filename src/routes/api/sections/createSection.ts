import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Section from '../../../models/section.model';
import Room from '../../../models/room.model';

/**
 * Route to create a section
 * @author Kevin Wang
 */

const createSectionRoute = async (req: Request, res: Response): Promise<void> => {
    // Get data from request and create section
    const { name, capacity, roomId } = req.body;
    const roomObjectId = Types.ObjectId(roomId);
    const section = new Section({
        name,
        capacity,
        roomId: roomObjectId
    });

    // Retrieve the room with the room id and push the section id into the list of section ids
    const room = await Room.findOne({ _id: roomObjectId }).catch((error) => {
        res.status(404).json({ error });
        return;
    });
    if (room) {
        room.sections.push(section.id);
    } else {
        res.status(404).json({ error: 'Room does not exist' });
        return;
    }

    // Save room and sections
    await room.save().catch((error) => {
        res.status(400).json({ error });
        return;
    });
    await section.save().catch((error) => {
        res.status(400).json({ error });
        return;
    });
    res.status(201).json({ section });
};

export default createSectionRoute;
