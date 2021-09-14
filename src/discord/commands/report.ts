import { CommandInteraction, MessageActionRow, MessageEmbed, MessageSelectMenu, MessageButton, SelectMenuInteraction, Message, ButtonInteraction } from 'discord.js';
import { Types } from 'mongoose';
import RoomModel from '../../models/room.model';
import SectionModel from '../../models/section.model';
import IssueModel from '../../models/issue.model';
import { DateTime } from 'luxon';

async function retrieveRooms(seletedRoomId?: string) {
    const rooms = [];
    const roomsJson = await RoomModel.find({});

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

async function retrieveSections(selectedRoomId: string, selectedSectionId?: string) {
    const sectionArray = [];
    const sectionJson = await SectionModel.find({ roomId: Types.ObjectId(selectedRoomId) });

    for (const section of sectionJson) {
        sectionArray.push({
            label: `‎‎${section.name}`,
            value: `‎${section._id}`,
            default: String(section._id) === selectedSectionId ? true : false,
        });
    }

    if (sectionArray.length === 0) {
        return new MessageButton().setCustomId('unavailable').setLabel('Room sections currently undefined or unavailable! Please select another room.').setStyle('DANGER').setDisabled(true);
    }

    return new MessageSelectMenu().setCustomId('sectionSelectMenu').setPlaceholder('Select a Section to Report!').addOptions(sectionArray);
}

export default {
    name: 'report',
    description: 'Report an issue for a certain section',
    options: [],

    async execute(interaction: CommandInteraction): Promise<void> {
        const mainEmbed = new MessageEmbed().setColor('#48d7fb').setTitle('Report an Issue').setDescription('Please pick a room and coressponding section to report!ㅤㅤㅤㅤ');
        const selectMenu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('roomSelectMenu')
                .setPlaceholder('Select a Room to Report!')
                .addOptions(await retrieveRooms())
        );

        const message = (await interaction.reply({ content: `${interaction.user}`, embeds: [mainEmbed], components: [selectMenu], ephemeral: false, fetchReply: true })) as Message;

        const selectMenuCollector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 120000 });
        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 120000 });
        const messageCollector = interaction!.channel!.createMessageCollector({ time: 120000 });

        let selectedroomId: string;
        let selectedsectionId: string;
        let roomSelectMenu: MessageActionRow;
        let issueMessage: string;

        selectMenuCollector.on('collect', async (menuInteraction: SelectMenuInteraction) => {
            if (menuInteraction.user.id === interaction.user.id) {
                switch (menuInteraction.customId) {
                    case 'roomSelectMenu': {
                        selectedroomId = menuInteraction.values[0];

                        roomSelectMenu = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('roomSelectMenu').addOptions(await retrieveRooms(selectedroomId)));
                        const sectionSelectMenu = new MessageActionRow().addComponents(await retrieveSections(selectedroomId));

                        menuInteraction.update({ embeds: [mainEmbed], components: [roomSelectMenu, sectionSelectMenu] });
                        break;
                    }
                    case 'sectionSelectMenu': {
                        //ESLint disabled for next line as regex is correct at removing unicode characters. Removes hidden unicode U+200E character that invalidates ObjectId casting
                        selectedsectionId = menuInteraction.values[0].replace(/[^\x00-\x7F]/g, ''); //eslint-disable-line

                        const sectionSelectMenu = new MessageActionRow().addComponents(await retrieveSections(selectedroomId, selectedsectionId));
                        const confirmButton = new MessageActionRow().addComponents(new MessageButton().setCustomId('confirmReport').setLabel('Confirm Report').setStyle('SUCCESS'));
                        const messageEmbed = new MessageEmbed()
                            .setColor('#64ff5c')
                            .setTitle(`Current Issue Description`)
                            .setDescription('Type a message in chat to submit a message with the report.\n\n***A message preview will be displayed here***');

                        menuInteraction.update({ embeds: [messageEmbed], components: [roomSelectMenu, sectionSelectMenu, confirmButton] });
                        break;
                    }
                    default:
                        console.log('Select menu not found.');
                }
            } else {
                menuInteraction.reply({ content: "This select menu isn't for you!", ephemeral: true });
            }
        });

        buttonCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
            if (buttonInteraction.user.id === interaction.user.id) {
                if (!issueMessage) {
                    buttonInteraction.reply({ content: 'No description provided. Please type a description of the issue in chat.', ephemeral: true });
                    return;
                }

                messageCollector.stop();

                const newIssue = await IssueModel.create({
                    timestamp: DateTime.now().setZone('America/Toronto').toJSDate(),
                    message: issueMessage,
                    status: 'Unresolved',
                    roomId: Types.ObjectId(selectedroomId),
                    sectionId: Types.ObjectId(selectedsectionId),
                    reportingUserId: Types.ObjectId('6122de0a0e655c53954d8a35'), //Currently hard-coded as no bridge between Discord Id and Object Id can be made.
                });

                await newIssue.save();

                buttonInteraction.reply({ content: 'Section successfully reported', ephemeral: true });
                await interaction.deleteReply();
            } else {
                buttonInteraction.reply({ content: "This button isn't for you!", ephemeral: true });
            }
        });

        messageCollector.on('collect', (message) => {
            if (message.author.id === interaction.user.id) {
                issueMessage = message.content;
                const messageEmbed = new MessageEmbed().setColor('#64ff5c').setTitle(`Current Issue Description`).setDescription(issueMessage);

                if (message.deletable) message.delete();

                interaction.editReply({ embeds: [messageEmbed] });
            }
        });
    },
};
