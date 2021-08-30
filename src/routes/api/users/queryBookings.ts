import { Request, Response } from 'express';
import { Types } from 'mongoose';
import TimeBlock from '../../../models/timeBlock.model';

const queryBookingsRoute = async (req: Request, res: Response): Promise<void> => {
    const { sectionId } = req.body;
    const sectionObjectId = Types.ObjectId(sectionId);

    const timeBlocksBooked = TimeBlock.find({ sectionId: sectionObjectId })
        .catch((error) => {
            res.status(404).json({ error });
            return;
        });
    res.status(200).json({ timeBlocksBooked });
}