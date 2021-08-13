import { Schema, model } from 'mongoose';
import { Schedule } from './../types/Schedule';

interface Room {
    name: string;
    closed: boolean;
    schedule: [Schedule];
}

const roomSchema = new Schema<Room>({
    name: { type: String, required: true },
    closed: { type: Boolean, required: true },
    schedule: [
        {
            dateOfWeek: String,
            start: String,
            end: String,
        },
    ],
});

const room = model<Room>('Room', roomSchema);

export default room;
