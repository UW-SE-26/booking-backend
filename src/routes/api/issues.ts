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

    const issue = await IssueModel.create({
        reportingUserEmail: req.userEmail,
        message: message,
        status: 'unresolved',
        bookingId: bookingId,
    });

    room.issues.push(issue._id);
    await room.save();

    const blamedTimeBlock = await TimeBlockModel.findOne({ sectionId: timeBlock.sectionId, startsAt: { $lte: timeBlock.startsAt } }).sort({ startsAt: -1 });

    if (!blamedTimeBlock) {
        res.status(400);
        return;
    }

    const blamedUsers = blamedTimeBlock.users;

    for (const blamedUser of blamedUsers) {
        await sendEmail({
            to: blamedUser,
            subject: 'Issue Reported',
            text: `An issue was reported for your booking`,
        }).catch(() => console.log('issue email to ${blamedUser} failed'));
    }

    res.status(201).json({ issue });
};

createIssueRoute.post('/create', authMiddleware, issueRoute);

export default createIssueRoute;
