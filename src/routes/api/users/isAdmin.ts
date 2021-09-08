import { Request, Response } from 'express';
import userModel from '../../../models/user.model';

const adminRoute = async (req: Request, res: Response): Promise<void> => {
    const user = await userModel.findOne({ email: req.userEmail });
    if (user!.admin) {
        res.status(200).json({ success: true });
    } else {
        res.status(402).json({ success: false });
    }
};

export default adminRoute;
