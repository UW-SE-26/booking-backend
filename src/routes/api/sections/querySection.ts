import { Request, Response } from 'express';
import sectionModel from '../../../models/section.model';
import userModel from '../../../models/user.model';

const querySectionRoute = async (req: Request, res: Response): Promise<void> => {
    const sectionId = req.params.id;
    const user = await userModel.findOne({ email: req.userEmail });

    if (!sectionId) {
        // If no id is given, return all sections
        const sectionInformation = await sectionModel.find({ program: user!.program });
        if (sectionInformation.length === 0) {
            res.status(400).json({ err: 'Wrong program' });
            return;
        }
        res.status(200).json({ sectionInformation });
        return;
    }

    const section = await sectionModel.findOne({ _id: sectionId });

    if (!section) {
        res.status(404);
        return;
    }

    res.status(200).json(section);
};

export default querySectionRoute;
