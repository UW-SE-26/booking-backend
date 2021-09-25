import { ApplicationCommandData, Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
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

        if (commandName === 'sendprompt') {
            const embed = new MessageEmbed()
                .setTitle('SE Student Spaces')
                .setDescription(
                    `SE spaces are now open for SE students to study in!
                    Due to COVID-19 restrictions, you must book these spaces here on Discord before you can use them. Rooms are divided into sections so that social distancing can be maintained.
                
                    Currently, only DC 2567 and DC 2577 are open. EIT 3146 and DC 2523 will be opening soon as additional study spaces.`
                )
                .addField('How do I book a space?', "Click the button below and follow the prompts to book a space. You'll receive a booking confirmation once your booking is created.")
                .setColor('#b265ff');

            const componentRow = new MessageActionRow().addComponents(
                new MessageButton().setCustomId('create_booking').setStyle('PRIMARY').setLabel('Create a Booking'),
                new MessageButton().setCustomId('view_bookings').setStyle('SECONDARY').setLabel('View My Bookings')
            );
            message.channel.send({ embeds: [embed], components: [componentRow] });
        }
    },
};
