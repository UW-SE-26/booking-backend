import { Request, Response } from 'express';
import BookingModel from '../../../models/booking.model';
import TimeBlockModel from '../../../models/timeBlock.model';

const deleteBookingRoute = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;

    // Retrieves the booking of the given id
    const booking = await BookingModel.findOne({ _id: id });

    if (!booking) {
        res.status(404);
        return;
    }

    // Returns an error if the user deleting the booking is not the same as the user who made the booking
    if (req.userEmail != booking.booker) {
        res.status(403).json({ error: 'user is not the booker of this booking so cannot delete it' });
        return;
    }

    // Retrieves the time block that corresponds to the booking
    const bookingTimeBlock = await TimeBlockModel.findOne({ _id: booking.timeBlock }).populate('bookings');

    if (!bookingTimeBlock) {
        res.status(400);
        return;
    }

    if (bookingTimeBlock.bookings.length == 1) {
        // If the booking is the only one in the time block
        // Delete the time block
        await TimeBlockModel.deleteOne({ _id: bookingTimeBlock._id });
    } else {
        // If there are other bookings in the time block
        // Delete the booking from the array of bookings for the time block
        await TimeBlockModel.updateOne({ _id: bookingTimeBlock._id }, { $pull: { bookings: { _id: booking._id } } });
    }

    // Delete the booking
    await BookingModel.deleteOne({ _id: id });

    res.sendStatus(204);
};

export default deleteBookingRoute;
