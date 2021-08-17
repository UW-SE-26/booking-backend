import { Router } from 'express';
import roomModel from '../../models/Room';
import sectionModel from '../../models/section.model';
import issueModel from '../../models/issue.model';

const createIssueRoute = Router();

createIssueRoute.post('/create', async (request, response) => {
    console.log(request.body); //displaying body so i can see in testing
    const { timestamp, message, roomId, sectionId } = request.body;
    const room = await roomModel.findById(roomId); //parsing for room id
    const section = await sectionModel.find({ sections: sectionId }); //parsing for room id
    const ts = Date.parse(timestamp); //parsing timestamp to store and convert / check if proper date type

    if (room === null) {
        //if the room isn't valid / isn't found in database
        response.status(422).json({ error: "That room doesn't exist, or was inputted incorrectly." });
        return;
    } else {
        //if the room is valid
        if (section === null) {
            //if the room's section isn't valid / isn't found in database
            response.status(422).json({ error: "That section doesn't exist, or was inputted incorrectly." });
            return;
        } else {
            //if the section is valid
            if (typeof message !== 'string') {
                //checks to ensure that the message is a string type to prevent attacks
                response.status(422).json({ error: "That message isn't the proper format!" });
                return;
            } else {
                //if the input type for message is string
                if (ts === null) {
                    response.status(422).json({ error: "That timestamp isn't the proper format!" });
                    return;
                } /*else {
                    //if the message is a valid format
                    console.log(room);
                }*/
            }
        }
    }

    const issue = new issueModel({
        //reportingUserId = ***WAITING FOR AUTH
        timestamp: ts,
        message: message,
        status: 'Unresolved',
        roomId: roomId,
        sectionId: sectionId,
    });

    await issue.save().catch(() => {
        response.status(400).json({ error: "The issue couldn't be created!" });
        return;
    });

    response.status(201).json({ issue });

    //check if sections room ID is equal/valid
    //tur timestamp into date with date.parse (date obj for database)
    //when issue's created, make status unresolved
});

export default createIssueRoute;
