import { Schema, model, ObjectId, Types } from 'mongoose'

interface Issue {

    reporting_user_id: ObjectId;
    timestamp: Date;
    message: string;
    status: string;
    room_id: ObjectId;
    section_id: ObjectId;

}

const issueSchema = new Schema<Issue>({

    reporting_user_id: { type: Types.ObjectId, required: true},
    timestamp: { type: Date, required: true},
    message: { type: String, required: true},
    status: { type: String, required: true},
    room_id: { type: Types.ObjectId, required: true},
    section_id: { type: Types.ObjectId, required: true}

});

const issueModel = model<Issue>('Issue', issueSchema);

export {issueModel}