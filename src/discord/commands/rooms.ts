import { CommandInteraction, MessageActionRow, MessageEmbed, MessageSelectMenu, MessageButton, SelectMenuInteraction, Message } from 'discord.js';
import { Types } from 'mongoose';
import Room from '../../models/room.model';
import Section from '../../models/section.model';
import bookCommand from '../../discord/commands/book';

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
            value: `‎${section._id}`,
        });
    }

    if (sectionArray.length === 0) {
        return new MessageButton().setCustomId('unavailable').setLabel('Room sections currently undefined or unavailable! Please select another room.').setStyle('DANGER').setDisabled(true);
    }

    return new MessageSelectMenu().setCustomId('sectionSelectMenu').setPlaceholder('Select a Section to Book!').addOptions(sectionArray);
}

export default {
    name: 'rooms',
    description: 'View all available rooms and sections for booking',
    options: [],

    async execute(interaction: CommandInteraction): Promise<void> {
        const embed = new MessageEmbed().setColor('#48d7fb').setTitle('View All Available Rooms').setDescription('Here are all the rooms currently available for booking!ㅤㅤㅤㅤ');
        const selectMenu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('roomSelectMenu')
                .setPlaceholder('Select a Room to Book!')
                .addOptions(await retrieveRooms())
        );

        const message = (await interaction.reply({ embeds: [embed], components: [selectMenu], ephemeral: false, fetchReply: true })) as Message;

        const selectMenuCollector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 120000 });
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

                        bookCommand.execute(menuInteraction, selectedRoomId, selectionSectionId);
                        await interaction.deleteReply();
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
