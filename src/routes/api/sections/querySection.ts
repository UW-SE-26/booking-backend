import { Request, Response } from 'express';
import sectionModel from '../../../models/section.model';
import timeblockModel from '../../../models/timeblock.model';
import Room from '../../../models/Room';
import { DateTime } from 'luxon';

/**
 * Route to query all sections or individual section
 * @author Ross Cleary, Kevin Wang
 */

const querySection = async (req: Request, res: Response): Promise<void> => {
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

        const start = DateTime.fromISO(String(startsAt), {zone: 'America/Toronto'});
        const end = DateTime.fromISO(String(endsAt), {zone: 'America/Toronto'});
        // Validates start and end dates
        if (start === null || end === null) {
            res.status(400).json({ error: 'validation failed, variable types are incorrect' });
            return;
        } else {
            // Retrives room that the section corresponds to
            const room = await Room.findOne({ _id: sectionInformation.roomId }).catch((error) => {
                res.status(404).json({ error });
                return;
            });

            if(!room) {
                res.status(404);
                return;
            }
            
            let currHourStart = start;
            let currHourEnd = currHourStart;
            currHourEnd = currHourEnd.plus({ hours: 1});

            const timeblocks = [];
            
            // Iterate through the hours in the given time range
            while (currHourStart < end) {
                // Finds schedule start and end for the day that the current hour falls on
                const currWeekDay = currHourStart.weekday;
                let scheduleDayStart = 0;
                let scheduleDayEnd = 0;
                for (const day of room.schedule) {
                    if (day.dateOfWeek == currWeekDay) {
                        scheduleDayStart = day.start;
                        scheduleDayEnd = day.end;
                    }
                }
                
                // Checks if the hour falls under an open time for the room and if it does adds hour to the list of available times
                if (!room.closed && (currHourStart.weekday == currHourEnd.weekday) && (currHourStart.hour >= scheduleDayStart && currHourEnd.hour <= scheduleDayEnd)) {
                    // Check for timeblock in database
                    const bookedTimeblock = await timeblockModel
                    .findOne({
                        sectionId: sectionInformation._id,
                        startsAt: currHourStart.toJSDate(),
                        endsAt: currHourEnd.toJSDate()
                    })
                    .catch((error) => {
                        res.status(404).json({ error });
                        return;
                    });

                    if (bookedTimeblock) {
                        const newTimeblock = {
                            startsAt: currHourStart.toJSDate(),
                            endsAt: currHourEnd.toJSDate(),
                            availableCapacity: sectionInformation.capacity - bookedTimeblock.users.length
                        }
                        timeblocks.push(newTimeblock);
                    } else {
                        const newTimeblock = {
                            startsAt: currHourStart.toJSDate(),
                            endsAt: currHourEnd.toJSDate(),
                            availableCapacity: sectionInformation.capacity
                        }
                        timeblocks.push(newTimeblock);
                    }
                }

                // Increments hour start and end for next iteration
                currHourStart = currHourStart.plus({ hours: 1 });
                currHourEnd = currHourEnd.plus({ hours: 1 })
            }

            // Sends response with section information and the array of available times in the time range given
            const section = {
                id: sectionInformation._id,
                name: sectionInformation.name,
                capacity: sectionInformation.capacity,
                availableTimes: timeblocks,
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

export default querySection;
