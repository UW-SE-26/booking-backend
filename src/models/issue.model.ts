import { Schema, model, ObjectId, Types } from 'mongoose';

interface Issue {
    reportingUserId: ObjectId;
    timestamp: Date;
    message: string;
    status: string;
    roomId: ObjectId;
    sectionId: ObjectId;
}

const issueSchema = new Schema<Issue>({
    reportingUserId: { type: Types.ObjectId, required: true },
    timestamp: { type: Date, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true },
    roomId: { type: Types.ObjectId, required: true },
    sectionId: { type: Types.ObjectId, required: true },
});

const issueModel = model<Issue>('Issue', issueSchema);

export default { issueModel };
