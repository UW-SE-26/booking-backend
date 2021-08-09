import { Schema, model } from 'mongoose';

interface Schedule {
    dateOfWeek: string;
    start: string;
    end: string;
}

interface Room {
    name: string;
    schedule: [Schedule];
    closed: boolean;
}

const schedule = {} as Schedule;
const roomSchema = new Schema<Room>({
    name: { type: String, required: true },
    schedule: [schedule],
    closed: { type: Boolean, required: true },
});

const room = model<Room>('Room', roomSchema);

export default room;
