import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { init as initDiscord } from './discord';

dotenv.config();

const app = express();

app.use('/api', apiRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Web app is listening on port ${process.env.PORT}`);
});

mongoose
    .connect(`${process.env.MONGO_URI}`, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Successfully connected to MongoDB database');
    })
    .catch((e) => {
        console.log(`Failed to connect to MongoDB database: ${e}`);
    });

initDiscord();
