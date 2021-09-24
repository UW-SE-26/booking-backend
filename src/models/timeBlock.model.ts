import { Schema, model, Types } from 'mongoose';

export interface TimeBlock {
    users: [string];
    booker: string;
    sectionId: Types.ObjectId;
    startsAt: Date;
}

const timeBlockSchema = new Schema<TimeBlock>(
    {
        users: [{ type: String, required: true }],
        booker: { type: String, required: true },
        sectionId: Types.ObjectId,
        startsAt: Date,
    },
    { timestamps: true }
);

const TimeBlockModel = model<TimeBlock>('TimeBlock', timeBlockSchema);

export default TimeBlockModel;
