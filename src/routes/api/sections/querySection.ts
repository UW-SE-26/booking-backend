import { Request, Response } from 'express';
import sectionModel from '../../../models/section.model';
import timeblockModel from '../../../models/timeblock.model';

/**
 * Route to query all sections or individual section
 * @author Ross Cleary, Kevin Wang
 */
const querySection = async (req: Request, res: Response): Promise<void> => {
    const { id, startsAt, endsAt } = req.query;
    if (id) {
        // If an id is included in the query
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
            const start = new Date(startsAt as string);
            const end = new Date(endsAt as string);
            // Validate date strings
            if (start === null || end === null) {
                res.status(400).json({ error: 'validation failed, variable types are incorrect' });
                return;
            } else {
                // Retrieves all time blocks for the room section within the time range given in the input
                const sectionTimeblocks = await timeblockModel
                    .find({
                        sectionId: sectionInformation._id,
                        startsAt: { $gte: start },
                        endsAt: { $lte: end },
                    })
                    .catch((error) => {
                        res.status(404).json({ error });
                        return;
                    });

                // Send response with section information
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
        // If no id is included in the query
        // Retrieve all sections
        const sectionInformation = await sectionModel.find({}).catch((error) => {
            res.status(404).json({ error });
            return;
        });
        res.status(200).json({ sectionInformation });
    }
};

export default querySection;
