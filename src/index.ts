import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import roomRoutes from './routes/api/room/room';
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

        app.use(express.json());
        app.use('/api', apiRoutes);
        app.use('/rooms', roomRoutes);
        app.listen(process.env.PORT, () => {
            console.log(`Web app is listening on port ${process.env.PORT}`);
        });
    })
    .catch((e) => {
        console.log(`Failed to connect to MongoDB database: ${e}`);
    });

initDiscord();
