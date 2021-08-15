import { Interaction } from 'discord.js';
import roomCommand from '../commands/rooms';

export default {
    name: 'interactionCreate',

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isSelectMenu()) return;

        roomCommand.updateReply(interaction);
    },
};
