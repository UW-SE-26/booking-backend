import { Schema, model, Types } from 'mongoose';

interface Booking {
    users: [string];
    timeBlock: Types.ObjectId;
    booker: string;
}

const bookingSchema = new Schema<Booking>({
    users: [{ type: String, required: true }],
    timeBlock: { type: Types.ObjectId, required: true, ref: 'TimeBlock' },
    booker: { type: String, required: true },
});

const booking = model<Booking>('Booking', bookingSchema);

export { Booking };
export default booking;
