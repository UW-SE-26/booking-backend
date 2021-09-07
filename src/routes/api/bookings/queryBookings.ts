import { Request, Response } from 'express';
import Booking from '../../../models/booking.model';

const queryBookingsRoute = async (req: Request, res: Response): Promise<void> => {
    const { userEmail } = req.body;
    let bookings;
    if (userEmail) {
        bookings = await Booking.find({ users: { $in: [userEmail] } });
        res.status(200).json({ bookings });
        return;
    } else {
        bookings = await Booking.find({});
        res.status(200).json({ bookings });
        return;
    }
};

export default queryBookingsRoute;
