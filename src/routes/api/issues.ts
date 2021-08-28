import { Router, Response, Request } from 'express';
import authMiddleware from '../../middleware/jwtVerify';
import roomModel from '../../models/room.model';
import sectionModel from '../../models/section.model';
import issueModel from '../../models/issue.model';
import userModel from '../../models/user.model';

const createIssueRoute = Router();

const issueRoute = async (request: Request, response: Response): Promise<void> => {
    const { timestamp, message, roomId, sectionId } = request.body;
    const room = await roomModel.findById(roomId); //parsing for room id
    const section = await sectionModel.find({ sections: sectionId }); //parsing for room id
    const ts = Date.parse(timestamp); //parsing timestamp to store and convert / check if proper date type
    const user = await userModel.findOne({ email: request.userEmail });
    
    //if the room is valid
    if (section === null) {
        //if the room's section isn't valid / isn't found in database
        response.status(422).json({ error: "That section doesn't exist, or was inputted incorrectly." });
        return;
    }
    //if the section is valid
    if (typeof message !== 'string') {
        //checks to ensure that the message is a string type to prevent attacks
        response.status(422).json({ error: "That message isn't the proper format!" });
        return;
    }
    //if the input type for message is string
    if (ts === null) {
        response.status(422).json({ error: "That timestamp isn't the proper format!" });
        return;
    }
    if (user === null) {
        response.status(422).json({ error: 'User not found!' });
        return;
    }

    const issue = new issueModel({
        timestamp: ts,
        message: message,
        status: 'Unresolved',
        roomId: roomId,
        sectionId: sectionId,
        reportingUserId: user.id,
    });
    if (room === null) {
        //if the room isn't valid / isn't found in database
        response.status(422).json({ error: "That room doesn't exist, or was inputted incorrectly." });
        return;
    } else {
        //if room exists, push the issue id as foreign key for future population in querying
        room.issues.push(issue.id);
    }

    //save room and issues
    let err = false;
    await room.save().catch((error) => {
        response.status(400).json({ error });
        return;
    });
    await issue.save().catch((e) => {
        console.log(e);
        response.status(400).json({ error: "The issue couldn't be created!" });
        err = true;
    });

    if (err) {
        return;
    }

    response.status(201).json({ issue });
};

createIssueRoute.post('/create', authMiddleware, issueRoute);

export default createIssueRoute;
