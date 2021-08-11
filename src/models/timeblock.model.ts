import { Schema, model, ObjectId, Types } from 'mongoose';

interface Timeblock {
    users: [ObjectId];
    sectionId: ObjectId;
    startsAt: Date;
    endsAt: Date;
}

const timeblockSchema = new Schema<Timeblock>({
    users: [Types.ObjectId],
    sectionId: Types.ObjectId,
    startsAt: Date,
    endsAt: Date,
});

const TimeblockModel = model<Timeblock>('Timeblock', timeblockSchema);

export default TimeblockModel;
