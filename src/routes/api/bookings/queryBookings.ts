import { Request, Response } from 'express';
import Booking from '../../../models/booking.model';

/**
 * Route to query all bookings or the bookings from one booker
 * @author Kevin Wang
 */
const queryBookingsRoute = async (req: Request, res: Response): Promise<void> => {
    const bookerEmail = req.query.id;
    if (bookerEmail) {
        if (typeof bookerEmail === 'string') {
            // If an booker's discord id is included in the query, retrieve the bookings of the and return the booking
            const bookings = await Booking.find({ booker: bookerEmail }).catch((error) => {
                res.status(404).json({ error });
                return;
            });
            res.status(200).json({ bookings });
        } else {
            // If an booker's discord id is not valid, return error
            res.status(404).json({ error: 'Validation failed, booker is not valid' });
        }
    } else {
        // If no booker's discord id is included in the query, retrieve all the bookings and return the booking
        const bookings = await Booking.find({}).catch((error) => {
            res.status(400).json({ error });
            return;
        });
        res.status(200).json({ bookings });
        return;
    }
};

export default queryBookingsRoute;
