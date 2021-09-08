import { Router, Response, Request } from 'express';
import authMiddleware from '../../middleware/jwtVerify';
import RoomModel from '../../models/room.model';
import SectionModel from '../../models/section.model';
import IssueModel from '../../models/issue.model';
import TimeBlockModel from '../../models/timeBlock.model';
import sendEmail from '../../util/email';

const createIssueRoute = Router();

const issueRoute = async (req: Request, res: Response): Promise<void> => {
    const { message, bookingId } = req.body;

    const timeBlock = await TimeBlockModel.findOne({ _id: bookingId });
    if (!timeBlock) {
        res.status(400);
        return;
    }
    const section = await SectionModel.findOne({ _id: timeBlock.sectionId });
    if (!section) {
        res.status(400);
        return;
    }
    const room = await RoomModel.findOne({ _id: section.roomId });
    if (!room) {
        res.status(400);
        return;
    }
 
    const issue = new IssueModel({
        reportingUserEmail: req.userEmail,
        message: message,
        status: 'unresolved',
        bookingId: bookingId
    });
    issue.save();

    room.issues.push(issue._id);
    room.save();

    const possibleTimeBlocks = await TimeBlockModel.find({ sectionId: timeBlock.sectionId, startsAt: { $lte: timeBlock.startsAt } });
    let maxDate = new Date(0);
    let blamedUsers;
    for (const possibleTimeBlock of possibleTimeBlocks) {
        if (possibleTimeBlock.startsAt > maxDate) {
            maxDate = possibleTimeBlock.startsAt;
            blamedUsers = possibleTimeBlock.users;
        }
    }

    if (!blamedUsers) {
        res.status(201).json({ issue });
        return;
    }

    for (const blamedUser of blamedUsers) {
        sendEmail({
            to: blamedUser,
            subject: 'Issue Reported',
            text: `An issue was reported for your booking`,
        }).then(() => console.log(`Verification email sent to ${req.body.email}`));
    }

    res.status(201).json({ issue });
};

createIssueRoute.post('/create', authMiddleware, issueRoute);

export default createIssueRoute;
