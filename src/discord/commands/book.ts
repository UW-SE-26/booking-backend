import { CommandInteraction, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, ButtonInteraction, SelectMenuInteraction, Message } from 'discord.js';
import roomModel, { Room } from '../../models/room.model';
import sectionModel, { Section } from '../../models/section.model';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';
import timeBlockModel from '../../models/timeBlock.model';

interface TimeblockInformation {
    booked: boolean;
    startsAt: number;
    endsAt: number;
    date: Date;
}

interface SectionInformation extends Section {
    _id?: Types.ObjectId;
}

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

function getDateOptions(selectedDate?: string) {
    const dateOptions = [];
    let currentDate = DateTime.now().setZone('America/Toronto');

    for (let i = 0; i < 14; i++) {
        dateOptions.push({
            label: `${currentDate.weekdayLong} - ${currentDate.monthLong} ${currentDate.day}${dateSuffix(currentDate.day)}`,
            value: currentDate.toISODate(),
            default: currentDate.toISODate() === selectedDate,
        });
        currentDate = currentDate.plus({ days: 1 });
    }
    return dateOptions;
}

async function parseCommandOptions(interaction: CommandInteraction): Promise<string[] | undefined> {
    //Parses the book command option parameters to return the corresponding Room's section ID
    const roomName = interaction.options.getString('room-name');
    const roomJson = await roomModel.findOne({ name: roomName !== null ? roomName : undefined });

    if (roomJson === null) {
        interaction.reply({ content: 'Invalid Room: Do `/rooms` to see all avaliable rooms!', ephemeral: true });
        return undefined;
    }

    const sectionJson = await sectionModel.find({ roomId: roomJson!._id });
    const specificSection = sectionJson.find((s) => s.name === interaction.options.getString('section-name'));

    if (specificSection === undefined) {
        interaction.reply({ content: 'Invalid Section: Do `/rooms` to see all avaliable rooms and sections!', ephemeral: true });
        return undefined;
    }

    return [roomJson._id, specificSection._id];
}

async function searchTimeblocks(selectedDate: string, sectionInformation: SectionInformation, roomInformation: Room): Promise<TimeblockInformation[]> {
    //Function finds all available timeblocks for a given date

    const startDate = DateTime.fromISO(String(selectedDate));

    // Validates start and end dates
    // Retrieves room that the section corresponds to
    if (!roomInformation) {
        return [];
    }
    if (roomInformation.closed) {
        return [];
    }

    const bookedTimeBlocks = await timeBlockModel
        .find({
            sectionId: sectionInformation._id,
            startsAt: { $gte: startDate.toJSDate(), $lte: startDate.plus({ days: 1 }).toJSDate() },
        })
        .populate('bookings');
    const timeBlocks: TimeblockInformation[] = [];

    let start = 0,
        end = 23; //make compiler shut up about being uninitialized

    for (const day of roomInformation.schedule) {
        if (day.dayOfWeek === startDate.weekday) {
            start = day.start;
            end = day.end;
            break;
        }
    }

    while (start < end) {
        const bookedTimeBlock = bookedTimeBlocks.find((timeBlock) => timeBlock.startsAt.getHours() === start);
        const timeBlock = {
            booked: bookedTimeBlock != null,
            date: startDate.toJSDate(),
            startsAt: start,
            endsAt: start + 1,
        };
        timeBlocks.push(timeBlock);
        start++;
    }

    return timeBlocks;
}

function timeConversion(time: number, date: Date) {
    //Converts 24 hour time to 12 hour time with a.m. and p.m. and changes 0:00 to 12:00
    return date.toISOString() + (time > 12 ? `${time - 12}:00 PM` : `${time}:00 AM`);
}

function parseTimeblocks(timeBlocks: TimeblockInformation[]) {
    //Sets up select menu options for timeblocks
    const timeBlockOptions = [];
    for (const timeBlock of timeBlocks) {
        timeBlockOptions.push({
            label: `${timeConversion(timeBlock.startsAt, timeBlock.date)} - ${timeConversion(timeBlock.endsAt, timeBlock.date)}`,
            value: `${timeConversion(timeBlock.startsAt, timeBlock.date)} - ${timeConversion(timeBlock.endsAt, timeBlock.date)}`,
        });
    }

    if (timeBlockOptions.length === 0) {
        return new MessageButton().setCustomId('unavailable').setLabel('No currently avaliable timeblocks on selected date').setStyle('DANGER').setDisabled(true);
    }
    return new MessageSelectMenu().setCustomId('timeBlockSelectMenu').setPlaceholder('Select a Time to Book!').addOptions(timeBlockOptions);
}

export default {
    name: 'book',
    description: 'Select a Date and Time for your Room Booking',
    options: [
        {
            type: 3,
            name: 'room-name',
            description: 'Name of Room to Book',
            required: true,
        },
        {
            type: 3,
            name: 'section-name',
            description: 'Name of Section to Book',
            required: true,
        },
    ],

    async execute(interaction: CommandInteraction | ButtonInteraction, _roomId?: string, _sectionId?: string): Promise<void> {
        if (interaction.isCommand()) {
            await parseCommandOptions(interaction).then((response) => {
                if (response === undefined) return;
                _roomId = response[0];
                _sectionId = response[1];
            });
        }

        if (_roomId === undefined || _sectionId === undefined) return;

        const roomInformation = await roomModel.findOne({ _id: _roomId });
        const sectionInformation = await sectionModel.findOne({ _id: _sectionId });

        const embed = new MessageEmbed()
            .setColor('#48d7fb')
            .setTitle('Date and Time')
            .setDescription('Choose the date and time of your booking.ㅤㅤㅤ ㅤ ㅤ ㅤㅤㅤ\n ')
            .setFooter(`Currently Booking: ${roomInformation!.name} - ${sectionInformation!.name}`);

        let selectMenuDate = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('dateSelectMenu').setPlaceholder('Select Date of Room Booking').addOptions(getDateOptions()));
        let avaliableTimeblocks;

        const message = (await interaction.reply({ embeds: [embed], components: [selectMenuDate], fetchReply: true })) as Message;

        const selectMenuCollector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 120000 });

        selectMenuCollector.on('collect', async (menuInteraction: SelectMenuInteraction) => {
            switch (menuInteraction.customId) {
                case 'dateSelectMenu':
                    selectMenuDate = new MessageActionRow().addComponents(
                        new MessageSelectMenu().setCustomId('dateSelectMenu').setPlaceholder('Select Date of Room Booking').addOptions(getDateOptions(menuInteraction.values[0]))
                    );
                    avaliableTimeblocks = new MessageActionRow().addComponents(parseTimeblocks((await searchTimeblocks(menuInteraction.values[0], sectionInformation!, roomInformation!))!));

                    menuInteraction.update({ components: [selectMenuDate, avaliableTimeblocks] });
                    break;
                case 'timeBlockSelectMenu':
                    //Temporary method for booking a room (postponed until database structure + user integration is fleshed out)
                    await menuInteraction.reply(`Timeslot ${menuInteraction.values[0]} supposedly booked!`);
                    await interaction.deleteReply();
                    break;
                default:
                    console.log('Selected Menu Not Found!');
            }
        });
    },
};
