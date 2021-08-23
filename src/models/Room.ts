import { Schema, model, Types } from 'mongoose';
import { Schedule } from './../types/Schedule';

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
            dateOfWeek: Number,
            start: Number,
            end: Number,
        },
    ],
});

const room = model<Room>('Room', roomSchema);

export default room;
