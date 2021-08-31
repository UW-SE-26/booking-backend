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
    const { id, startsAt, endsAt } = req.query;

    if (id && startsAt && endsAt) {
        // If an id and time range is included in the query, retrieves the room section with the id given in the link
        const sectionInformation = await sectionModel.findOne({ _id: id }).catch((error) => {
            res.status(500).json({ error });
            return;
        });

        if (!sectionInformation) {
            res.status(404);
            return;
        }

        const start = DateTime.fromISO(String(startsAt), { zone: 'America/Toronto' });
        const end = DateTime.fromISO(String(endsAt), { zone: 'America/Toronto' });

        // Checks that the given time range does not exceed 31 days
        const range = end.toMillis() - start.toMillis();
        if (range > 2678400000) {
            res.status(400).json({ error: 'time range is greater than 31 days' });
            return;
        }

        // Validates start and end dates
        if (start === null || end === null) {
            res.status(400).json({ error: 'validation failed, variable types are incorrect' });
            return;
        } else {
            // Retrieves room that the section corresponds to
            const room = await Room.findOne({ _id: sectionInformation.roomId }).catch((error) => {
                res.status(404).json({ error });
                return;
            });

            if (!room) {
                res.status(404);
                return;
            }

            let currHourStart = start;
            let currHourEnd = currHourStart.plus({ hours: 1 });

            // Finds and stores all booked time blocks within the given time range
            const bookedTimeBlocks = await timeBlockModel
                .find({
                    sectionId: sectionInformation._id,
                    startsAt: { $gte: start.toJSDate() },
                    endsAt: { $lte: end.toJSDate() },
                })
                .populate('bookings')
                .catch((error) => {
                    res.status(500).json({ error });
                    return [];
                });

            const timeBlocks = [];

            // Iterate through the hours in the given time range
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
                        let currUserCount = 0;
                        for (const booking of bookedTimeBlockFound.bookings) {
                            currUserCount += booking.users.length;
                        }
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

            // Sends response with section information and the array of available times in the time range given
            const section = {
                id: sectionInformation._id,
                name: sectionInformation.name,
                capacity: sectionInformation.capacity,
                availableTimes: timeBlocks,
            };
            res.status(201).json(section);
        }
    } else {
        // If no id and time range is included in the query, retrieve all sections
        const sectionInformation = await sectionModel.find({}).catch((error) => {
            res.status(404).json({ error });
            return;
        });
        res.status(200).json({ sectionInformation });
    }
};

export default querySectionRoute;
