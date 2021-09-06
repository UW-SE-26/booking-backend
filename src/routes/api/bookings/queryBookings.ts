import e, { Request, Response } from 'express';
import Booking from '../../../models/booking.model';

const queryBookingsRoute = async (req: Request, res: Response): Promise<void> => {
    const bookerDiscord = req.query.id;
    if (bookerDiscord && typeof bookerDiscord === "string") {
        const bookings = await Booking.find({ booker: bookerDiscord })
            .catch((error) => {
                res.status(404).json({ error });
                return;
            });
        res.status(200).json({ bookings })
    } else {
        res.status(404).json({ error: "Validation failed, booker is not valid" });
        return;
    }
}

export default queryBookingsRoute;