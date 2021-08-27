import { CommandInteraction, MessageActionRow, MessageEmbed, MessageSelectMenu, MessageButton, SelectMenuInteraction, ButtonInteraction, Message } from 'discord.js';
import { Types } from 'mongoose';
import Room from '../../models/room.model';
import Section from '../../models/section.model';
import bookCommand from '../../discord/commands/book';

async function retrieveRooms(seletedRoomId?: string) {
    const rooms = [];
    const roomsJson = await Room.find({});

    for (const room of roomsJson) {
        if (!room.closed) {
            rooms.push({
                label: room.name !== undefined ? room.name : `Room ${String(room._id)}`,
                value: String(room._id),
                default: String(room._id) === seletedRoomId ? true : false,
            });
        }
    }

    return rooms;
}

async function retrieveSections(selectedRoomId: string) {
    const sectionArray = [];
    const sectionJson = await Section.find({ roomId: Types.ObjectId(selectedRoomId) });

    for (const section of sectionJson) {
        sectionArray.push(new MessageButton().setCustomId(String(section._id)).setLabel(section.name).setStyle('PRIMARY'));
    }

    if (sectionArray.length === 0) {
        sectionArray.push(
            new MessageButton().setCustomId('unavailable').setLabel('Room sections currently undefined or unavailable! Please select another room.').setStyle('DANGER').setDisabled(true)
        );
    }

    return sectionArray;
}

export default {
    name: 'rooms',
    description: 'View all avaliable rooms and sections for booking',
    options: [],

    async execute(interaction: CommandInteraction): Promise<void> {
        const embed = new MessageEmbed().setColor('#48d7fb').setTitle('View All Avaliable Rooms').setDescription('Here are all the rooms currently avaliable for booking!ㅤㅤㅤㅤ');
        const selectMenu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('roomSelectMenu')
                .setPlaceholder('Select a Room to Book!')
                .addOptions(await retrieveRooms())
        );

        const message = (await interaction.reply({ embeds: [embed], components: [selectMenu], ephemeral: false, fetchReply: true })) as Message;

        const selectMenuCollector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 120000 });
        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 120000 });
        let selectedroomId: string;

        selectMenuCollector.on('collect', async (menuInteraction: SelectMenuInteraction) => {
            selectedroomId = menuInteraction.values[0];

            const sectionButtons = new MessageActionRow().addComponents(await retrieveSections(selectedroomId));
            const selectMenu = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('roomSelectMenu').addOptions(await retrieveRooms(selectedroomId)));

            menuInteraction.update({ components: [selectMenu, sectionButtons] });
        });

        buttonCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
            selectMenuCollector.stop();
            buttonCollector.stop();

            bookCommand.execute(buttonInteraction, selectedroomId, buttonInteraction.customId);
            await interaction.deleteReply();
        });
    },
};
