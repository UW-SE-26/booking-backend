import { Schema, model, Types, Document, PopulatedDoc } from 'mongoose';

interface TimeBlock {
    users: [String];
    booker: String;
    sectionId: Types.ObjectId;
    startsAt: Date;
    endsAt: Date;
}

const timeBlockSchema = new Schema<TimeBlock>({
    users: [{ type: String, required: true }],
    booker: { type: String, required: true },
    sectionId: Types.ObjectId,
    startsAt: Date,
    endsAt: Date,
});

const TimeBlockModel = model<TimeBlock>('TimeBlock', timeBlockSchema);

export default TimeBlockModel;
