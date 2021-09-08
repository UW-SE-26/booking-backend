import { Request, Response } from 'express';
import TimeBlockModel from '../../../models/timeBlock.model';

const deleteBookingRoute = async (req: Request, res: Response): Promise<void> => {
    const bookingId = req.params.id;

    // Retrieves the booking of the given id
    const booking = await TimeBlockModel.findOne({ _id: bookingId });

    if (!booking) {
        res.status(404);
        return;
    }

    // Returns an error if the user deleting the booking is not the same as the user who made the booking
    if (req.userEmail != booking.booker) {
        res.status(403).json({ error: 'user is not the booker of this booking so cannot delete it' });
        return;
    }

    await TimeBlockModel.deleteOne({ _id: bookingId });

    res.sendStatus(204);
};

export default deleteBookingRoute;
