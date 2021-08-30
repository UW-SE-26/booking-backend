import e, { Request, Response } from 'express';
import { Types } from 'mongoose';
import TimeBlock from '../../../models/timeBlock.model';

const queryBookingsRoute = async (req: Request, res: Response): Promise<void> => {
    const sectionId = req.query.id;
    if (sectionId && typeof sectionId === "string") {
        const sectionObjectId = Types.ObjectId(sectionId);
            const timeBlocksBooked = await TimeBlock.find({ sectionId: sectionObjectId })
                .populate('section')
                .catch((error) => {
                    res.status(404).json({ error });
                    return;
                });
            if (!timeBlocksBooked) {
                res.status(404).json({ error: "Booking does not exist" });
                return;
            } else {
                res.status(200).json({ timeBlocksBooked });
            }   
    } else {
        res.status(404).json({ error: "Validation failed, section is not valid" });
        return;
    }
}

export default queryBookingsRoute;