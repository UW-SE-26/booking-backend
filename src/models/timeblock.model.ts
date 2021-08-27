import { Schema, model, ObjectId, Types } from 'mongoose';

interface TimeBlock {
    // Users that are signed up for time block
    users: [ObjectId];
    // Id of the room section that the time block corresponds to
    sectionId: Types.ObjectId;
    startsAt: Date;
    endsAt: Date;
}

const timeBlockSchema = new Schema<TimeBlock>({
    // Users that are signed up for time block
    users: [Types.ObjectId],
    // Id of the room section that the time block corresponds to
    sectionId: Types.ObjectId,
    startsAt: Date,
    endsAt: Date,
});

const TimeBlockModel = model<TimeBlock>('TimeBlock', timeBlockSchema);

export default TimeBlockModel;
