import { Schema, model, ObjectId, Types } from 'mongoose';

interface Issue {
    reportingUserEmail: string;
    message: string;
    status: string;
    bookingId: ObjectId;
}

const issueSchema = new Schema<Issue>({
    reportingUserEmail: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true },
    bookingId: { type: Types.ObjectId, required: true },
});

const issueModel = model<Issue>('Issue', issueSchema);

export default issueModel;
