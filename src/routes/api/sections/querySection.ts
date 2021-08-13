import { Request, Response } from 'express';
import sectionModel from '../../../models/section.model';
import timeblockModel from '../../../models/timeblock.model';

const querySection = async (req: Request, res: Response): Promise<void> => {
    // Retrieves the room section with the id given in the link
    const sectionInformation = await sectionModel.findOne({_id: req.params.id}).catch((error) => {
        res.status(404).json({ error });
        return;
    });
    if(!sectionInformation) {
        return;
    }

    // Retrieves all time blocks within the date range given in the input
    const sectionTimeblocks = await timeblockModel
    .find({
    sectionId: sectionInformation._id,
    startsAt: {$gte: new Date(req.body.starts_at)},
    endsAt: {$lte: new Date(req.body.ends_at)}
    }).catch((error) => {
        res.status(404).json({ error });
        return;
    });

    const section = ({
        id: sectionInformation._id,
        name: sectionInformation.name,
        capacity: sectionInformation.capacity,
        availableTimes: sectionTimeblocks
    });
    res.status(201).json(section);
};

export default querySection;
