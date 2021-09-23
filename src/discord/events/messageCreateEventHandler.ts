import { ApplicationCommandData, Message } from 'discord.js';
import commands from '../commands';

export default {
    name: 'messageCreate',

    async execute(message: Message): Promise<void> {
        if (!message.content.startsWith('$') || message.author.bot || message.author.id !== process.env.BOT_OWNER_ID) return;

        const messageContent = message.content.slice(1).replace(/\s+/g, ' ').trim().split(/ (.+)/);
        const commandName = messageContent.shift()?.toLowerCase();

        if (commandName === 'deployguild' || commandName === 'deployglobal') {
            const data: ApplicationCommandData[] = [];

            for (const command of commands) {
                if (command.enabled) {
                    data.push({
                        name: command.name,
                        description: command.description,
                        options: command.options,
                    });
                }
            }

            if (commandName === 'deployguild') {
                if (message.guild) {
                    await message.guild.commands.set(data);
                    message.reply('Slash commands have been loaded in this guild!');
                } else {
                    message.reply("You can't set guild commands outside of a guild!");
                }
            } else if (commandName === 'deployglobal') {
                await message.client.application?.commands.set(data);
                message.reply('Slash commands have been loaded globally!');
            }
        } else if (commandName === 'resetguild') {
            if (message.guild) {
                await message.guild.commands.set([]);
                message.reply('Guild commands have been successfully reset.');
            } else {
                message.reply("You can't reset guild commands outside of a guild!");
            }
        } else if (commandName === 'resetglobal') {
            await message.client.application?.commands.set([]);
            message.reply('Global commands have been successfully reset.');
        }
    },
};
