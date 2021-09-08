import { Schema, model, Types } from 'mongoose';
import { Schedule } from '../types/Schedule';

export interface Room {
    name: string;
    closed: boolean;
    sections: [Types.ObjectId];
    issues: [Types.ObjectId];
    schedule: [Schedule];
    program: string;
}

const roomSchema = new Schema<Room>({
    name: { type: String, required: true },
    closed: { type: Boolean, required: true },
    sections: [{ type: Types.ObjectId, ref: 'Section' }],
    issues: [{ type: Types.ObjectId, ref: 'Issue' }],
    schedule: [
        {
            // Number from 0-6 representing the week day where Sunday = 0, Monday = 1 ... Saturday = 6
            dayOfWeek: Number,
            // Number from 0-23 representing the hour on the dayOfWeek that the room opens in ET
            start: Number,
            // Number from 0-23 representing the hour of the dayOfWeek that the room closes in ET
            end: Number,
        },
    ],
    program: {
        type: String,
        enum: ['SE', 'ECE'],
        default: 'SE'
    }
});

const room = model<Room>('Room', roomSchema);

export default room;
