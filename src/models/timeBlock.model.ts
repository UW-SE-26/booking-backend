import { Schema, model, Types, Document, PopulatedDoc } from 'mongoose';
import { Booking } from './booking.model';

interface TimeBlock {
    // Users that are signed up for time block
    bookings: PopulatedDoc<Booking & Document>;
    // Id of the room section that the time block corresponds to
    sectionId: Types.ObjectId;
    startsAt: Date;
    endsAt: Date;
}

const timeBlockSchema = new Schema<TimeBlock>({
    // Users that are signed up for time block
    bookings: [{ type: Types.ObjectId, ref: 'Booking' }],
    // Id of the room section that the time block corresponds to
    sectionId: Types.ObjectId,
    startsAt: Date,
    endsAt: Date,
});

const TimeBlockModel = model<TimeBlock>('TimeBlock', timeBlockSchema);

export default TimeBlockModel;
