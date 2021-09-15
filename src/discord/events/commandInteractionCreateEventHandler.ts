import { Interaction } from 'discord.js';
import commands from '../commands/index';

export default {
    name: 'interactionCreate',

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isCommand()) return;

        const authGuild = interaction.client.guilds.cache.get('811408878162935829');

        if (!authGuild) {
            return interaction.reply({ content: 'We ran into an error authenticating you. Please try again later or message an admin.', ephemeral: true });
        } else {
            const member = await authGuild.members.fetch(interaction.user.id);
            if (!member.roles.cache.find((role) => role.name === 'SE')) {
                return interaction.reply({
                    content: 'You must have the SE role on the SE Soc Discord server to create a booking. Join and verify here: https://discord.gg/Kc6AdbpvCX',
                    ephemeral: true,
                });
            }
        }
        const command = commands.find((c) => c.name === interaction.commandName);

        if (command) {
            command.execute(interaction);
        }
    },
};
