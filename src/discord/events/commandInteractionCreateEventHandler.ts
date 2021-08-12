import { Interaction } from 'discord.js';
import commands from '../commands/index';

export default {
    name: 'interactionCreate',

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isCommand()) return;

        const command = commands.find((c) => c.name === interaction.commandName);

        if (command) {
            command.execute(interaction);
        }
    },
};
