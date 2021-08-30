import { Schema, model, Types } from 'mongoose';

interface Booking {
    users: [string];
    timeBlock: Types.ObjectId;
    booker: string;
}

const bookingSchema = new Schema<Booking>({
    users: [{ type: String, ref: 'User' }],
    timeBlock: { type: Types.ObjectId, ref: 'TimeBlock' },
    booker: { type: String, ref: 'User' },
});

const booking = model<Booking>('Booking', bookingSchema);

export default booking;
