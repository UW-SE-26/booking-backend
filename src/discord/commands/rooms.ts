import { CommandInteraction, MessageActionRow, MessageEmbed, MessageSelectMenu, MessageButton, SelectMenuInteraction } from 'discord.js';
import { Types } from 'mongoose';
import Room from '../../models/Room';
import Section from '../../models/section.model';

async function retrieveRooms(seletedRoomId: string) {
    const rooms = [];
    const roomsJson = await Room.find({});

    for (const room of roomsJson) {
        if (!room.closed) {
            rooms.push({
                label: room.name,
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
        sectionArray.push(new MessageButton().setCustomId(section.name).setLabel(section.name).setStyle('PRIMARY'));
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
                .addOptions(await retrieveRooms(''))
        );
        interaction.reply({ embeds: [embed], components: [selectMenu], ephemeral: true });
    },

    async updateReply(interaction: SelectMenuInteraction): Promise<void> {
        const sectionButtons = new MessageActionRow().addComponents(await retrieveSections(interaction.values[0]));
        const selectMenu = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('roomSelectMenu').addOptions(await retrieveRooms(interaction.values[0])));
        interaction.update({ components: [selectMenu, sectionButtons] });
    },
};
