import { Router } from 'express';
import sectionModel from '../../../models/section.model';
import timeblockModel from '../../../models/timeblock.model';

const mongoose = require('mongoose');

const router = Router();

router.post('/:id', async (req, res) => {
    const sectionInformation = await sectionModel.findById(req.params.id).catch((error) => {
        res.status(404).json({ error });
        return;
    });

    const sectionTimeblocks = await timeblockModel
    .find({
    sectionId: mongoose.Types.ObjectId(req.params.id), 
    startsAt: {$gte: req.body.starts_at},
    endsAt: {$lte: req.body.ends_at}
    }).catch((error) => {
        res.status(404).json({ error });
        return;
    });

    const section = {
        sectionInformation,
        available_times: sectionTimeblocks
    }

    res.status(201).json(section);
});

export default router;