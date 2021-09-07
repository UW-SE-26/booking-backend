import { Request, Response } from 'express';
import sectionModel from '../../../models/section.model';
import timeBlockModel from '../../../models/timeBlock.model';
import Room from '../../../models/room.model';
import { DateTime } from 'luxon';

/**
 * Route to query all sections or individual section
 * @author Ross Cleary, Kevin Wang
 */

const querySectionRoute = async (req: Request, res: Response): Promise<void> => {
    const { id, date } = req.query;

    if (!(id && date)) {
        // If no id and time range is included in the query, retrieve all sections
        const sectionInformation = await sectionModel.find({});
        res.status(200).json({ sectionInformation });
        return;
    }
    // If an id and time range is included in the query, retrieves the room section with the id given in the link
    const sectionInformation = await sectionModel.findOne({ _id: id });

    if (!sectionInformation) {
        res.status(404);
        return;
    }
    const startDate = DateTime.fromISO(String(date));

    // Validates start and end dates
    // Retrieves room that the section corresponds to
    const room = await Room.findOne({ _id: sectionInformation.roomId });
    if (!room) {
        res.status(400).json({ err: 'Room not found' });
        return;
    }
    if (room.closed) {
        res.status(403).json({ err: 'Room is closed' });
        return;
    }
    const bookedTimeBlocks = await timeBlockModel
        .find({
            sectionId: sectionInformation._id,
            startsAt: { $gte: startDate.toJSDate(), $lte: startDate.plus({ days: 1 }).toJSDate() },
        })
        .populate('bookings');
    const timeBlocks = [];

    let start = 0,
        end = 23; //make compiler shut up about being uninitialized

    for (const day of room.schedule) {
        if (day.dayOfWeek === startDate.weekday) {
            start = day.start;
            end = day.end;
            break;
        }
    }

    while (start < end) {
        const bookedTimeBlock = bookedTimeBlocks.find((timeBlock) => timeBlock.startsAt.getHours() === start);
        const timeBlock = {
            booked: bookedTimeBlock != null,
            startsAt: start,
            endsAt: start + 1,
        };
        timeBlocks.push(timeBlock);
        start++;
    }

    const section = {
        id: sectionInformation._id,
        name: sectionInformation.name,
        capacity: sectionInformation.capacity,
        availableTimes: timeBlocks,
    };
    res.status(200).json(section);
};

export default querySectionRoute;
