import { Schema, model, Types } from 'mongoose';

interface Section {
    name: string;
    capacity: number;
    roomId: Types.ObjectId;
}

const sectionSchema = new Schema<Section>({
    name: String,
    capacity: Number,
    roomId: Types.ObjectId,
});

const sectionModel = model<Section>('Section', sectionSchema);

export default sectionModel;
