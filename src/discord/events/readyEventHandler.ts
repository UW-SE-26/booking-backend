import { Client } from 'discord.js';

export default {
    name: 'ready',

    async execute(client: Client): Promise<void> {
        console.log(`Logged in as ${client.user!.tag}`);
    },
};
