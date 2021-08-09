import { Schema, model, Types } from 'mongoose';

interface Room {
    name: string;
    sections: Types.Array<string>;
    schedule: Types.Array<Record<string, string[]>>;
    closed: boolean;
}

const roomSchema = new Schema<Room>({
    name: String,
    sections: [],
    schedule: [],
    closed: Boolean,
});

const room = model<Room>('Room', roomSchema);

export default room;
