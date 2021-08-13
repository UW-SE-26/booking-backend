import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import sectionRoutes from './routes/api/sections/section';

import { init as initDiscord } from './discord';

dotenv.config();

mongoose
    .connect(`${process.env.MONGO_URI}`, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Successfully connected to MongoDB database');
    
        const app = express();

        app.use('/api', apiRoutes);
        app.use('/api/sections', sectionRoutes);
        app.listen(process.env.PORT, () => {
            console.log(`Web app is listening on port ${process.env.PORT}`);
        });
    })
    .catch((e) => {
        console.log(`Failed to connect to MongoDB database: ${e}`);
    });

initDiscord();
