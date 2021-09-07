import { Request, Response } from 'express';
import Booking from '../../../models/booking.model';

/**
 * Route to query all bookings or the bookings associated with a user
 * @author Kevin Wang
 */
const queryBookingsRoute = async (req: Request, res: Response): Promise<void> => {
    const { userEmail } = req.body;
    let bookings;
    if (userEmail) {
        // If an user's email is included in the query, retrieve the bookings of the and return the bookings
        bookings = await Booking.find({ users: { $in: [userEmail] }});
        res.status(200).json({ bookings });
        return;
    } else {
        // If no user's email is included in the query, retrieve all the bookings and return the bookings
        bookings = await Booking.find({});
        res.status(200).json({ bookings });
        return;
    }
};

export default queryBookingsRoute;