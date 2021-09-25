import { CommandInteraction, MessageButton, MessageEmbed, MessageActionRow, MessageSelectMenu, SelectMenuInteraction, TextChannel, Client, ButtonInteraction } from 'discord.js';
import TimeblockModel from '../../models/timeBlock.model';
import SectionModel from '../../models/section.model';
import RoomModel from '../../models/room.model';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';
import { nanoid } from 'nanoid';

type FullBookingInfo = {
    roomName: string;
    sectionName: string;
    capacity: number;
    startDate: DateTime;
    endDate: DateTime;
    bookingUsers: string[];
    booker: string;
    bookingId: string;
    accessInformation?: string;
};

function dateSuffix(day: number) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

function timeConversion(timeObject: DateTime) {
    //Converts 24 hour time to 12 hour time with a.m. and p.m. and changes 0:00 to 12:00
    return timeObject.setZone('America/Toronto').toFormat('h:mm a');
}

async function getBookingInformation(timeBlockId: string): Promise<FullBookingInfo | undefined> {
    const bookedBooking = await TimeblockModel.findOne({ _id: Types.ObjectId(timeBlockId) });

    if (!bookedBooking) {
        return undefined;
    }

    const bookedSection = await SectionModel.findOne({ _id: bookedBooking.sectionId });

    if (!bookedSection) {
        return undefined;
    }

    const bookedRoom = await RoomModel.findOne({ _id: bookedSection.roomId });

    if (!bookedRoom) {
        return undefined;
    }

    const _startDate = DateTime.fromJSDate(bookedBooking.startsAt).setZone('America/Toronto');

    return {
        roomName: bookedRoom.name,
        sectionName: bookedSection.name,
        capacity: bookedSection.capacity,
        startDate: _startDate,
        endDate: _startDate.plus({ hours: 1 }),
        bookingUsers: bookedBooking.users,
        booker: bookedBooking.booker,
        bookingId: bookedBooking._id,
        accessInformation: bookedRoom.accessInformation,
    };
}

export async function getBookingInfoEmbed(client: Client, timeBlockId: string): Promise<MessageEmbed> {
    const bookingInformation = await getBookingInformation(timeBlockId);

    if (bookingInformation) {
        const authGuild = client.guilds.cache.get('811408878162935829');
        const authorUsername = authGuild?.members.cache.get(bookingInformation.booker)?.user.tag ?? bookingInformation.booker;

        const accessInformation = bookingInformation.accessInformation ?? 'No access code is required to enter this room.';

        const informationEmbed = new MessageEmbed()
            .setColor('#48d7fb')
            .setAuthor(`Booked by: ${authorUsername ?? bookingInformation.booker}`) //Author field does not accept Discord ID to Mention conversion
            .setTitle(`${bookingInformation.roomName} - ${bookingInformation.sectionName}`)
            .setDescription(`This section has a maximum capacity of ${bookingInformation.capacity} people. Please do **not** bring more people than the max capacity.`)
            .addField(
                'Date:',
                `${bookingInformation.startDate.weekdayLong}, ${bookingInformation.startDate.monthLong} ${bookingInformation.startDate.day}${dateSuffix(bookingInformation.startDate.day)}`,
                true
            )
            .addField('Time:', `${timeConversion(bookingInformation.startDate)} - ${timeConversion(bookingInformation.endDate)}`, true)
            .addField('Access Information', accessInformation)
            .setFooter(`Booking ID: ${bookingInformation.bookingId}`);

        return informationEmbed;
    } else {
        return new MessageEmbed().setColor('RED').setDescription('Error retrieving booked bookings. Please contact an admin for help.');
    }
}

async function getUserBookings(userId: string, selectMenuId: string) {
    const bookingOptions = [];
    const bookedBookings = await TimeblockModel.find({ users: { $in: [userId] }, startsAt: { $gte: new Date() } }).sort({ startsAt: 1 });

    for (const booking of bookedBookings) {
        const label = booking.booker === userId ? 'Booked' : 'Invited';
        const bookingInformation = await getBookingInformation(booking._id);

        if (!bookingInformation) {
            return undefined;
        }

        bookingOptions.push({
            label: `${label}: ${bookingInformation.roomName} - ${bookingInformation.sectionName}`,
            description: `${bookingInformation.startDate.weekdayLong} - ${bookingInformation.startDate.monthLong} ${bookingInformation.startDate.day}${dateSuffix(
                bookingInformation.startDate.day
            )}: ${timeConversion(bookingInformation.startDate)} - ${timeConversion(bookingInformation.endDate)}`,
            value: `${bookingInformation.bookingId}`,
        });
    }

    if (!bookingOptions.length) {
        return new MessageActionRow().addComponents(new MessageButton().setCustomId('unavailable').setLabel('No Bookings Were Found').setStyle('DANGER').setDisabled(true));
    }

    return new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId(selectMenuId).setPlaceholder('Select your Bookings').addOptions(bookingOptions));
}

export default {
    name: 'view',
    description: 'View all your current bookings',
    options: [],
    enabled: true,

    async execute(interaction: CommandInteraction | ButtonInteraction): Promise<void> {
        const titleEmbed = new MessageEmbed().setColor('#48d7fb').setTitle('Your Current Bookings').setDescription('Select a certain booking to see more information.ㅤㅤㅤ ㅤ ㅤ ㅤㅤㅤ\n ');
        const selectMenuId = nanoid();
        const bookingResponse = await getUserBookings(interaction.user.id, selectMenuId);

        if (!bookingResponse) {
            interaction.reply('Error retrieving booked bookings. Please contact an admin.');
            return;
        }

        await interaction.reply({ embeds: [titleEmbed], components: [bookingResponse], ephemeral: true });
        const channel = interaction.channel?.partial ? await interaction.channel.fetch() : (interaction.channel as TextChannel);
        const selectMenuCollector = channel.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 600000 });

        selectMenuCollector.on('collect', async (selectMenuInteraction: SelectMenuInteraction) => {
            if (selectMenuInteraction.customId === selectMenuId) {
                if (selectMenuInteraction.user.id === interaction.user.id) {
                    const informationEmbed = await getBookingInfoEmbed(selectMenuInteraction.client, selectMenuInteraction.values[0]);

                    selectMenuInteraction.reply({ embeds: [informationEmbed], ephemeral: true });
                } else {
                    selectMenuInteraction.reply({ content: "This select menu isn't for you!", ephemeral: true });
                }
            }
        });

        selectMenuCollector.on('end', async () => {
            await interaction.editReply({ embeds: [new MessageEmbed().setDescription('This prompt has expired.').setColor('RED')], components: [] });
        });
    },
};
