import { Schema, model, ObjectId, Types } from 'mongoose';

interface Timeblock {
    // Users that are signed up for timeblock
    users: [ObjectId];
    // Id of the room section that the timeblock corresponds to
    sectionId: ObjectId;
    startsAt: Date;
    endsAt: Date;
}

const timeblockSchema = new Schema<Timeblock>({
    // Users that are signed up for timeblock
    users: [Types.ObjectId],
    // Id of the room section that the timeblock corresponds to
    sectionId: Types.ObjectId,
    startsAt: Date,
    endsAt: Date,
});

const TimeblockModel = model<Timeblock>('Timeblock', timeblockSchema);

export default TimeblockModel;
