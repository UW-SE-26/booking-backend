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

    const start = DateTime.fromISO(String(date));

    // Validates start and end dates
    // Retrieves room that the section corresponds to
    const room = await Room.findOne({ _id: sectionInformation.roomId });
    if (!room) {
        res.status(400).json({ err: 'Room not found' });
        return;
    }
    let currHourStart = start;
    let currHourEnd = currHourStart.plus({ hours: 1 });
    const bookedTimeBlocks = await timeBlockModel
        .find({
            sectionId: sectionInformation._id,
            startsAt: { $gte: start.toJSDate() },
            endsAt: { $lte: end.toJSDate() },
        })
        .populate('bookings');
    const timeBlocks = [];
    while (currHourStart < end) {
        // Finds schedule start and end for the day that the current hour falls on
        const currWeekDay = currHourStart.weekday;
        let scheduleDayStart = 0;
        let scheduleDayEnd = 0;
        for (const day of room.schedule) {
            if (day.dayOfWeek == currWeekDay) {
                scheduleDayStart = day.start;
                scheduleDayEnd = day.end;
            }
        }

        // Checks if the hour falls under an open time for the room and if it does adds hour to the list of available times
        if (!room.closed && currHourStart.weekday == currHourEnd.weekday && currHourStart.hour >= scheduleDayStart && currHourEnd.hour <= scheduleDayEnd) {
            // Check for time block in database
            const bookedTimeBlockFound = bookedTimeBlocks.find((bookedTimeBlock) => bookedTimeBlock.startsAt.getTime() === currHourStart.toMillis());

            if (bookedTimeBlockFound) {
                // If a time block for the current hour does exist
                const currUserCount = bookedTimeBlockFound.bookings.reduce((total: number, booking: TimeBlock) => total + booking.users.length, 0);
                const newTimeBlock = {
                    startsAt: currHourStart.toJSDate(),
                    endsAt: currHourEnd.toJSDate(),
                    availableCapacity: sectionInformation.capacity - currUserCount,
                };
                timeBlocks.push(newTimeBlock);
            } else {
                // If a time block for the current hour does not exist
                const newTimeBlock = {
                    startsAt: currHourStart.toJSDate(),
                    endsAt: currHourEnd.toJSDate(),
                    availableCapacity: sectionInformation.capacity,
                };
                timeBlocks.push(newTimeBlock);
            }
        }

        // Increments hour start and end for next iteration
        currHourStart = currHourStart.plus({ hours: 1 });
        currHourEnd = currHourEnd.plus({ hours: 1 });
    }
    const section = {
        id: sectionInformation._id,
        name: sectionInformation.name,
        capacity: sectionInformation.capacity,
        availableTimes: timeBlocks,
    };
    res.status(201).json(section);
};

export default querySectionRoute;
