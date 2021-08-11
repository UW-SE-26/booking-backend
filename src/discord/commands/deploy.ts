import { ApplicationCommandData, CommandInteraction } from 'discord.js';
import commands from './index';

export default {
    name: 'deploy',
    description: 'Deploys slash commands in current guild - meant for testing.',
    options: [],

    async execute(interaction: CommandInteraction): Promise<void> {
        const data: ApplicationCommandData[] = [];

        for (const command in commands) {
            data.push({
                name: commands[command].name,
                description: commands[command].description,
                options: commands[command].options,
            });
        }

        await interaction.guild!.commands.set(data);
        interaction.reply('Slash commands have been loaded in this guild!').catch(() => interaction.reply('Error!'));
    },
};
