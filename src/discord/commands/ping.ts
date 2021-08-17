import { CommandInteraction } from 'discord.js';

export default {
    name: 'ping',
    description: 'Ping!',
    options: [],

    async execute(interaction: CommandInteraction): Promise<void> {
        interaction.reply('Pong!');
    },
};
