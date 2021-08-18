import { Request, Response } from 'express';
import sectionModel from '../../../models/section.model';
import timeblockModel from '../../../models/timeblock.model';

const querySection = async (req: Request, res: Response): Promise<void> => {
    const { id, startsAt, endsAt } = req.query;
    if (id) {
        // Retrieves the room section with the id given in the link
        const sectionInformation = await sectionModel.findOne({ _id: id }).catch((error) => {
            res.status(404).json({ error });
            return;
        });
        if (!sectionInformation) {
            res.status(404);
            return;
        }

        if (startsAt && endsAt) {
            if (typeof startsAt != 'string' || typeof endsAt != 'string') {
                res.status(400).json({ error: 'validation failed, variable types are incorrect' });
                return;
            } else {
                // Retrieves all time blocks for the room section within the time range given in the input
                const sectionTimeblocks = await timeblockModel
                    .find({
                        sectionId: sectionInformation._id,
                        startsAt: { $gte: new Date(startsAt) },
                        endsAt: { $lte: new Date(endsAt) },
                    })
                    .catch((error) => {
                        res.status(404).json({ error });
                        return;
                    });

                const section = {
                    id: sectionInformation._id,
                    name: sectionInformation.name,
                    capacity: sectionInformation.capacity,
                    bookedTimes: sectionTimeblocks,
                };
                res.status(201).json(section);
            }
        }
    } else {
        const sectionInformation = await sectionModel.find({}).catch((error) => {
            res.status(404).json({ error });
            return;
        });
        res.status(200).json({ sectionInformation });
    }
};

export default querySection;
