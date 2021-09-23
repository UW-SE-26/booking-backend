import {
    CommandInteraction,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    MessageButton,
    SelectMenuInteraction,
    User,
    Guild,
    CategoryChannel,
    Permissions,
    Snowflake,
    TextChannel,
} from 'discord.js';
import { Types } from 'mongoose';
import Room from '../../models/room.model';
import Section from '../../models/section.model';
import manualBookCommand from './manualbook';

async function retrieveRooms(selectedRoomId?: string) {
    const rooms = [];
    const roomsJson = await Room.find({});

    for (const room of roomsJson) {
        if (!room.closed) {
            rooms.push({
                label: room.name !== undefined ? room.name : `Room ${String(room._id)}`,
                value: String(room._id),
                default: String(room._id) === selectedRoomId,
            });
        }
    }

    return rooms;
}

async function retrieveSections(selectedRoomId: string) {
    const sectionArray = [];
    const sectionJson = await Section.find({ roomId: Types.ObjectId(selectedRoomId) });

    for (const section of sectionJson) {
        sectionArray.push({
            label: `‎‎${section.name}`,
            description: `Section Capacity: ${section.capacity}`,
            value: `‎${section._id}`,
        });
    }

    if (sectionArray.length === 0) {
        return new MessageButton().setCustomId('unavailable').setLabel('Room sections currently undefined or unavailable! Please select another room.').setStyle('DANGER').setDisabled(true);
    }

    return new MessageSelectMenu().setCustomId('sectionSelectMenu').setPlaceholder('Select a Section to Book!').addOptions(sectionArray);
}

async function fetchOrCreatePrivateChannel(user: User, guild: Guild, botId: Snowflake): Promise<TextChannel | null> {
    const existingChannel = guild.channels.cache.find((channel) => channel.name === `book-${user.id}` && channel.isText() && !channel.isThread());
    if (existingChannel) {
        return existingChannel as TextChannel;
    }

    await guild.channels.fetch();

    const fetchedExistingChannel = guild.channels.cache.find((channel) => channel.name === `book-${user.id}` && channel.isText() && !channel.isThread());
    if (fetchedExistingChannel) {
        return fetchedExistingChannel as TextChannel;
    }

    const category = guild.channels.cache.find((channel) => channel.name === 'Bookings' && channel instanceof CategoryChannel) as CategoryChannel;
    if (!category) {
        console.log('Error: Booking category not found!');
        return null;
    }
    const newChannel = await guild.channels.create(`book-${user.id}`, {
        parent: category,
        permissionOverwrites: [
            {
                id: guild.roles.everyone,
                deny: [Permissions.FLAGS.VIEW_CHANNEL],
            },
            {
                id: user.id,
                allow: [Permissions.FLAGS.VIEW_CHANNEL],
            },
            {
                id: botId,
                allow: [Permissions.FLAGS.VIEW_CHANNEL],
            },
        ],
    });

    return newChannel;
}

export default {
    name: 'book',
    description: 'View all available rooms and sections for booking',
    options: [],

    async execute(interaction: CommandInteraction): Promise<void> {
        const privateChannel = interaction.guild
            ? await fetchOrCreatePrivateChannel(interaction.user, interaction.guild, interaction.client.user!.id)
            : interaction.channel?.partial
            ? await interaction.channel.fetch()
            : interaction.channel;

        if (!privateChannel) {
            await interaction.reply({ content: 'This bot is not properly configured. Please contact an admin for help.', ephemeral: true });
            return;
        }

        const embed = new MessageEmbed().setColor('#48d7fb').setTitle('View All Available Rooms').setDescription('Here are all the rooms currently available for booking!ㅤㅤㅤㅤ');
        const selectMenu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('roomSelectMenu')
                .setPlaceholder('Select a Room to Book!')
                .addOptions(await retrieveRooms())
        );

        const message = await privateChannel.send({ content: `${interaction.user}`, embeds: [embed], components: [selectMenu] });

        if (interaction.channelId === privateChannel.id) {
            await interaction.reply({
                embeds: [new MessageEmbed().setColor('GREEN').setTitle('Booking Process Started')],
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                embeds: [new MessageEmbed().setColor('GREEN').setTitle('Booking Process Started').setDescription(`[Click here to start the booking!](${message.url})`)],
                ephemeral: true,
            });
        }

        const selectMenuCollector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 600000 });
        let selectedRoomId: string;

        selectMenuCollector.on('collect', async (menuInteraction: SelectMenuInteraction) => {
            if (menuInteraction.user.id === interaction.user.id) {
                switch (menuInteraction.customId) {
                    case 'roomSelectMenu': {
                        selectedRoomId = menuInteraction.values[0];

                        const roomSelectMenu = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('roomSelectMenu').addOptions(await retrieveRooms(selectedRoomId)));
                        const sectionSelectMenu = new MessageActionRow().addComponents(await retrieveSections(selectedRoomId));

                        menuInteraction.update({ components: [roomSelectMenu, sectionSelectMenu] });
                        break;
                    }
                    case 'sectionSelectMenu': {
                        //ESLint disabled for next line as regex is correct at removing unicode characters. Removes hidden unicode U+200E character that invalidates ObjectId casting
                        const selectionSectionId = menuInteraction.values[0].replace(/[^\x00-\x7F]/g, ''); //eslint-disable-line

                        manualBookCommand.execute(menuInteraction, selectedRoomId, selectionSectionId);
                        await message.delete();
                        break;
                    }
                    default:
                        console.log('Select menu not found.');
                }
            } else {
                menuInteraction.reply({ content: "This select menu isn't for you!", ephemeral: true });
            }
        });
    },
};
