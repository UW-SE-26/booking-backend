import { Message } from 'discord.js';

export default {
    name: 'messageCreate',

    async execute(message: Message): Promise<void> {
        if (!message.content.startsWith('$') || message.author.bot) return;

        const messageContent = message.content.slice(1).replace(/\s+/g, ' ').trim().split(/ (.+)/);
        const commandName = messageContent.shift()?.toLowerCase();

        if (commandName === 'deploy') {
            const data = {
                name: 'deploy',
                description: 'Deploys slash commands in current guild - meant for testing.',
                options: [],
            };

            await message.guild!.commands.create(data);
            message.reply('Deploy command created! Do `/deploy` to deploy the remainder of the commands.');
        }
    },
};
