import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Section from '../../../models/section.model';
import Room from '../../../models/room.model';
import userModel from '../../../models/user.model';

const createSectionRoute = async (req: Request, res: Response): Promise<void> => {
    // Get data from request and create section
    const { name, capacity, roomId } = req.body;

    const user = await userModel.findOne({ email: req.userEmail });
    if (!user!.admin) {
        res.status(403);
        return;
    }

    const roomObjectId = Types.ObjectId(roomId);
    const section = new Section({
        name,
        capacity,
        roomId: roomObjectId,
    });

    // Retrieve the room with the room id and push the section id into the list of section ids
    const room = await Room.findOne({ _id: roomObjectId });

    if (room) {
        room.sections.push(section.id);
    } else {
        res.status(404).json({ error: 'Room does not exist' });
        return;
    }

    // Save room and sections
    await room.save();
    await section.save();
    res.status(201).json({ section });
};

export default createSectionRoute;
