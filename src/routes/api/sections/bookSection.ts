import { Request, Response } from 'express';
import timeBlockModel from '../../../models/timeBlock.model';
import sectionModel from '../../../models/section.model';
import Room from '../../../models/room.model';
import { DateTime } from 'luxon';

const bookSectionRoute = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { emails, startsAt, endsAt } = req.body;

    // Checks for needed request body variables
    if (!id || !emails || !startsAt || !endsAt) {
        res.status(400);
        return;
    }

    // Retrieves section with the section id given
    const sectionInformation = await sectionModel.findOne({ _id: id }).catch((error) => {
        res.status(500).json({ error });
        return;
    });

    if (!sectionInformation) {
        res.status(404);
        return;
    }

    // Retrieves room that the section corresponds to
    const room = await Room.findOne({ _id: sectionInformation.roomId }).catch((error) => {
        res.status(404).json({ error });
        return;
    });

    if (!room) {
        res.status(404);
        return;
    }

    const start = DateTime.fromISO(String(startsAt), { zone: 'America/Toronto' });
    const end = DateTime.fromISO(String(endsAt), { zone: 'America/Toronto' });

    // Determine if the requested booking is valid by checking if all of the hours fall under open times and that the section will never be over capacity
    let currHourStart = start;
    let currHourEnd = currHourStart.plus({ hours: 1 });
    let invalidHours = false;
    let overCapacity = false;
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
        if (room.closed || currHourStart.weekday != currHourEnd.weekday || currHourStart.hour < scheduleDayStart || currHourEnd.hour > scheduleDayEnd) {
            invalidHours = true;
            break;
        }

        // Query a time block for the current hour
        const bookingTimeBlock = await timeBlockModel
        .findOne({
            sectionId: sectionInformation._id,
            startsAt: currHourStart.toJSDate(),
            endsAt: currHourEnd.toJSDate()
        })
        .catch((error) => {
            res.status(500).json({ error });
            return;
        });
    
        if (!bookingTimeBlock) {
            // If a time block for the current hour does not exist
            // Check if the amount of users will exceed to the section capacity
            if (emails.length > sectionInformation.capacity) {
                overCapacity = true;
                break;
            } 
        } else {
            // If a time block for the current hour does exist
            // Check if the amount of users already booked plus the new users will exceed to the section capacity
            const newUsers = bookingTimeBlock.users.concat(emails);
            if (newUsers.length > sectionInformation.capacity) {
                overCapacity = true;
                break;
            }
        }

        // Increments hour start and end for next iteration
        currHourStart = currHourStart.plus({ hours: 1 });
        currHourEnd = currHourEnd.plus({ hours: 1 });
    }

    // If booking is not valid, respond with success as false and give reason as message
    if (invalidHours) {
        const response = {
            sectionId: id,
            success: false,
            message: "booking unsuccessful, times do not fall under open room hours"
        }
        res.status(200).json(response);
        return;
    }
    if (overCapacity) {
        const response = {
            sectionId: id,
            success: false,
            message: "booking unsuccessful, more users than available spots"
        }
        res.status(200).json(response);
        return;
    }

    currHourStart = start;
    currHourEnd = currHourStart.plus({ hours: 1 });

    while (currHourStart < end) {
        // Query a time block for the current hour
        const bookingTimeBlock = await timeBlockModel
        .findOne({
            sectionId: sectionInformation._id,
            startsAt: currHourStart.toJSDate(),
            endsAt: currHourEnd.toJSDate()
        })
        .catch((error) => {
            res.status(500).json({ error });
            return;
        });

        if (!bookingTimeBlock) {
            // If a time block for the current hour does not exist
            // Add the new time block
            const newTimeBlock = new timeBlockModel({
                users: emails,
                sectionId: sectionInformation._id,
                startsAt: currHourStart.toJSDate(),
                endsAt: currHourEnd.toJSDate()
            })
            await newTimeBlock.save();
        } else {
            // If a time block for the current hour does exist
            // Delete the current time block and add the updated one with the new users
            timeBlockModel.deleteOne({_id: bookingTimeBlock._id}).catch((error) => {
                res.status(500).json({ error });
                return;
            });
            const newUsers = bookingTimeBlock.users.concat(emails);
            const newTimeBlock = new timeBlockModel({
                users: newUsers,
                sectionId: sectionInformation._id,
                startsAt: currHourStart.toJSDate(),
                endsAt: currHourEnd.toJSDate()
            })
            newTimeBlock.save();
        }

        // Increments hour start and end for next iteration
        currHourStart = currHourStart.plus({ hours: 1 });
        currHourEnd = currHourEnd.plus({ hours: 1 });
    }

    // Respond with success as true
    const response = {
        sectionId: id,
        success: true,
        message: "booking added successfully"
    }
    res.status(200).json(response);
}

export default bookSectionRoute;
