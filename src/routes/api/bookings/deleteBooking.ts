import { Request, Response } from 'express';
import BookingModel from '../../../models/booking.model';
import TimeBlockModel from '../../../models/timeBlock.model';

const deleteBookingRoute = async (req: Request, res: Response): Promise<void> => {
    const id = req.query.id;

    const booking = await BookingModel.findOne({ _id: id }).catch((error) => {
        res.status(500).json({ error });
        return;
    });

    if (!booking) {
        res.status(404);
        return;
    }

    const bookingTimeBlock = await TimeBlockModel.findOne({ _id: booking.timeBlock })
        .populate('bookings')
        .catch((error) => {
            res.status(500).json({ error });
            return;
        });

    if (!bookingTimeBlock) {
        res.status(404);
        return;
    }

    if (bookingTimeBlock.bookings.length == 1) {
        await TimeBlockModel.deleteOne({ _id: bookingTimeBlock._id });
    } else {
        await TimeBlockModel.updateOne({ _id: bookingTimeBlock._id }, { $pull: { bookings: { _id: booking._id } } });
    }

    await BookingModel.deleteOne({ _id: id });

    res.sendStatus(200);
};

export default deleteBookingRoute;
