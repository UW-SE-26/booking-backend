import { Request, Response } from 'express';
import TimeBlockModel from '../../../models/timeBlock.model';

const queryBookingsRoute = async (req: Request, res: Response): Promise<void> => {
    const userEmail = req.userEmail

    const bookings = await TimeBlockModel.find({ users: { $in: [userEmail] } });
    res.status(200).json({ bookings });

    const returnBookings = [];
    for (const booking of bookings) {
        returnBookings.push({
            isBooker: booking.booker === userEmail,
            timeBlock: booking
        });
    }

    res.status(200).json(returnBookings);
};

export default queryBookingsRoute;
