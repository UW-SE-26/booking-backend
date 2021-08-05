import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { init as initDiscord } from './discord';

dotenv.config();

const app = express();

app.use('/api', apiRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Web app is listening on port ${process.env.PORT}`);
});

initDiscord();
