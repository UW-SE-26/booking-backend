import { Request, Response } from 'express';
import TimeBlock from '../../../models/timeBlock.model';
import Section from '../../../models/section.model';

const createBookingRoute = async (req: Request, res: Response): Promise<void> => {
    const { sectionId, userEmails, bookerEmail, startAt } = req.body;

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

    const newTimeBlock = await TimeBlock.create({
        sectionId,
        userEmails,
        bookerEmail,
        startAt,
    });
    res.status(200).json({ timeBlock: newTimeBlock });
};

export default createBookingRoute;
