import { Schema, model, ObjectId, Types } from 'mongoose';

interface Section {
    name: string;
    capacity: number;
    // Id of the room that the section corresponds to
    roomId: ObjectId;
}

const sectionSchema = new Schema<Section>({
    name: String,
    capacity: Number,
    // Id of the room that the section corresponds to
    roomId: Types.ObjectId,
});

const sectionModel = model<Section>('Section', sectionSchema);

export default sectionModel;
