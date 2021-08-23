import { Schema, model, Types } from 'mongoose';
import { Schedule } from '../types/Schedule';

interface Room {
    name: string;
    closed: boolean;
    sections: [Types.ObjectId];
    schedule: [Schedule];
}

const roomSchema = new Schema<Room>({
    name: { type: String, required: true },
    closed: { type: Boolean, required: true },
    sections: [{ type: Types.ObjectId, ref: 'Section' }],
    schedule: [
        {
            // Number from 0-6 representing the week day where Sunday = 0, Monday = 1 ... Saturday = 6
            dayOfWeek: Number,
            // Number from 0-23 representing the hour on the dayOfWeek that the room opens in ET
            start: Number,
            // Number from 0-23 representing the hour of the dayOfWeek that the room closes in ET
            end: Number
        },
    ],
});

const room = model<Room>('Room', roomSchema);

export default room;
