import { ApplicationCommandData, CommandInteraction } from 'discord.js';
import commands from './index';

export default {
    name: 'deploy',
    description: 'Deploys slash commands in current guild - meant for testing.',
    options: [],

    async execute(interaction: CommandInteraction): Promise<void> {
        const data: ApplicationCommandData[] = [];

        for (const command of commands) {
            data.push({
                name: command.name,
                description: command.description,
                options: command.options,
            });
        }

        await interaction.guild!.commands.set(data);
        interaction.reply('Slash commands have been loaded in this guild!').catch(() => interaction.reply('Error!'));
    },
};
