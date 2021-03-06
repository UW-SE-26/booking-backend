import { Request, Response } from 'express';
import TimeBlock from '../../../models/timeBlock.model';
import Section from '../../../models/section.model';
import Room from '../../../models/room.model';
import userModel from '../../../models/user.model';

const createBookingRoute = async (req: Request, res: Response): Promise<void> => {
    const { sectionId, userEmails, startAt } = req.body;
    const bookerEmail = req.userEmail;
    // Validating for time block nullability
    const timeBlockRetrieved = await TimeBlock.findOne({ sectionId: sectionId, startAt: startAt });
    if (timeBlockRetrieved) {
        res.status(400).json({ error: 'booking unsuccessful, timeBlock already existed' });
        return;
    }

    // Validating on capacity and section nullability
    const sectionRetrieved = await Section.findOne({ _id: sectionId });
    if (sectionRetrieved) {
        if (userEmails.length > sectionRetrieved.capacity) {
            res.status(400).json({ error: 'booking unsuccessful, more users than available spots' });
            return;
        }
    } else {
        res.status(400).json({ error: 'booking unsuccessful, section does not exist' });
        return;
    }

    const room = await Room.findOne({ _id: sectionRetrieved.roomId });
    const user = await userModel.findOne({ email: bookerEmail });
    if (room!.program !== user!.program) {
        res.status(400).json({ error: 'booking unsuccessful, wrong program' });
        return;
    }

    const newTimeBlock = await TimeBlock.create({
        sectionId,
        userEmails,
        bookerEmail,
        startAt,
    });
    res.status(200).json({ timeBlock: newTimeBlock });
};

export default createBookingRoute;
