import { Request, Response } from 'express';
import sectionModel from '../../../models/section.model';
import timeblockModel from '../../../models/timeblock.model';
import Room from '../../../models/Room';

const querySection = async (req: Request, res: Response): Promise<void> => {
    // Retrieves the room section with the id given in the link
    const sectionInformation = await sectionModel.findOne({ _id: req.params.id }).catch((error) => {
        res.status(500).json({ error });
        return;
    });
    if (!sectionInformation) {
        res.status(404);
        return;
    }
    
    // Retrives room that the section corresponds to
    const room = await Room.findOne({ _id: sectionInformation.roomId }).catch((error) => {
        res.status(404).json({ error });
        return;
    });

    if(!room) {
        res.status(404);
        return;
    }

    const rangeStartDate = new Date(req.body.startsAt);
    const rangeEndDate = new Date(req.body.endsAt);
    const currHourStartDate = rangeStartDate;
    const currHourEndDate = currHourStartDate;
    currHourEndDate.setMilliseconds(currHourEndDate.getMilliseconds() + 60 * 60 * 1000)

    const timeblocks = [];
    
    // Iterate through the hours in the given time range
    while (currHourStartDate < rangeEndDate) {
        // Check if current hour falls under an open time
        const currWeekDay = currHourStartDate.getDay();
        
        let scheduleDayStart;
        let scheduleDayEnd;
        for (const day of room.schedule) {
            if (day.dateOfWeek == currWeekDay) {
                scheduleDayStart = day.start;
                scheduleDayEnd = day.end;
            }
        }

        if (!scheduleDayStart) {
            res.status(404);
            return;
        }
        if (!scheduleDayEnd) {
            res.status(404);
            return;
        }

        if (currHourStartDate.getHours() >= scheduleDayStart && currHourEndDate.getHours() <= scheduleDayEnd) {
            // Check for timeblock in database
            const  bookedTimeblock = await timeblockModel
            .findOne({
                sectionId: sectionInformation._id,
                startsAt: new Date(currHourStartDate),
                endsAt: new Date(currHourStartDate.setMilliseconds(currHourStartDate.getMilliseconds() + 60 * 60 * 1000))
            })
            .catch((error) => {
                res.status(404).json({ error });
                return;
            });

            if (bookedTimeblock) {
                const newTimeblock = {
                    startsAt: currHourStartDate,
                    endsAt: currHourStartDate.setMilliseconds(currHourStartDate.getMilliseconds() + 60 * 60 * 1000),
                    availableCapacity: sectionInformation.capacity - bookedTimeblock.users.length
                }
                timeblocks.push(newTimeblock);
            } else {
                const newTimeblock = {
                    startsAt: currHourStartDate,
                    endsAt: currHourStartDate.setMilliseconds(currHourStartDate.getMilliseconds() + 60 * 60 * 1000),
                    availableCapacity: sectionInformation.capacity
                }
                timeblocks.push(newTimeblock);
            }
        }

        currHourStartDate.setMilliseconds(currHourStartDate.getMilliseconds() + 60 * 60 * 1000);
    }

    const section = {
        id: sectionInformation._id,
        name: sectionInformation.name,
        capacity: sectionInformation.capacity,
        bookedTimes: timeblocks,
    };
    res.status(201).json(section);
};

export default querySection;
