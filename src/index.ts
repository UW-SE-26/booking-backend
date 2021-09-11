import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/api';
import { JWTPayload } from 'jose/webcrypto/types';
import { init as initDiscord } from './discord';
import cookieParser from 'cookie-parser';
import schedule from 'node-schedule';
import { DateTime } from 'luxon';
import timeBlockModel from './models/timeBlock.model';

import './util/keypair'; //Make sure pub/priv keygen is done

// Merged declaration of Request
declare module 'express-serve-static-core' {
    interface Request {
        payload: JWTPayload;
        userEmail: string;
    }
}

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

        // Enable CORS for all origins for testing
        app.use(cors());
        app.use(express.json());
        app.use(cookieParser());
        app.use('/api', apiRoutes);
        app.listen(process.env.PORT, () => {
            console.log(`Web app is listening on port ${process.env.PORT}`);
        });
    })
    .catch((e) => {
        console.log(`Failed to connect to MongoDB database: ${e}`);
    });

if (process.env.ENABLE_DISCORD_BOT === 'true' && process.env.DISCORD_TOKEN !== undefined) {
    initDiscord();
}

schedule.scheduleJob('0 0 * * *', async () => {
    let date = DateTime.now();
    date = date.minus({ days: 7 });
    await timeBlockModel.deleteMany({ startsAt: { $lt: date.toJSDate() } });
});
