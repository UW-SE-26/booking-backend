import { CommandInteraction, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, ButtonInteraction, SelectMenuInteraction, Message } from 'discord.js';
import roomModel, { Room } from '../../models/room.model';
import sectionModel, { Section } from '../../models/section.model';
import Timeblock from '../../models/timeblock.model';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';

interface TimeblockInformation {
    startsAt: Date;
    endsAt: Date;
    availableCapacity: number;
}

interface sectionInformation extends Section {
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
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dateOptions = [];
    const date = new Date();

    for (let i = 0; i < 14; i++) {
        dateOptions.push({
            label: `${days[date.getDay()]} - ${months[date.getMonth()]} ${date.getDate()}${dateSuffix(date.getDate())}`,
            value: date.toLocaleDateString().split('/').reverse().join('-'),
            default: date.toLocaleDateString().split('/').reverse().join('-') === selectedDate ? true : false,
        });
        date.setDate(date.getDate() + 1);
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

    return [roomJson._id, specificSection?._id];
}

async function searchTimeblocks(selectedDate: string, sectionInformation: sectionInformation, roomInformation: Room) {
    const currentDate = new Date();
    let nextHour = '00';

    if (currentDate.toLocaleDateString().split('/').reverse().join('-') === selectedDate) {
        nextHour = String(currentDate.getHours() + 1);

        if (nextHour.length === 1) {
            nextHour = `0${nextHour}`;
        }
    }

    const startDate = DateTime.fromISO(String(`${selectedDate}T${nextHour}:00`), { zone: 'America/Toronto' });
    const endDate = DateTime.fromISO(String(`${selectedDate}T23:00`), { zone: 'America/Toronto' });

    const bookedTimeblocks = await Timeblock.find({
        sectionId: sectionInformation._id,
        startsAt: { $gte: startDate.toJSDate() },
        endsAt: { $lte: endDate.toJSDate() },
    });

    const timeBlocks = [];
    let currHourStart = startDate;
    let currHourEnd = currHourStart.plus({ hours: 1 });

    // Iterate through the hours in the given time range
    while (currHourStart < endDate) {
        // Finds schedule start and end for the day that the current hour falls on
        const currWeekDay = currHourStart.weekday;
        let scheduleDayStart = 0;
        let scheduleDayEnd = 0;
        for (const day of roomInformation.schedule) {
            if (day.dayOfWeek + 1 === currWeekDay) {
                scheduleDayStart = day.start;
                scheduleDayEnd = day.end;
            }
        }

        // Checks if the hour falls under an open time for the room and if it does adds hour to the list of available times
        if (!roomInformation.closed && currHourStart.weekday === currHourEnd.weekday && currHourStart.hour >= scheduleDayStart && currHourEnd.hour <= scheduleDayEnd) {
            // Check for time block in database
            const bookedTimeBlockFound = bookedTimeblocks.find((bookedTimeBlock) => bookedTimeBlock.startsAt.getTime() === currHourStart.toMillis());

            if (bookedTimeBlockFound) {
                const newTimeBlock = {
                    startsAt: currHourStart.toJSDate(),
                    endsAt: currHourEnd.toJSDate(),
                    availableCapacity: sectionInformation.capacity - bookedTimeBlockFound.users.length,
                };
                timeBlocks.push(newTimeBlock);
            } else {
                const newTimeBlock = {
                    startsAt: currHourStart.toJSDate(),
                    endsAt: currHourEnd.toJSDate(),
                    availableCapacity: sectionInformation.capacity,
                };
                timeBlocks.push(newTimeBlock);
            }
        }

        // Increments hour start and end for next iteration
        currHourStart = currHourStart.plus({ hours: 1 });
        currHourEnd = currHourEnd.plus({ hours: 1 });
    }
    return timeBlocks;
}

function timeConversion(timeObject: Date) {
    let convertedTime = timeObject.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    if (convertedTime[0] === '0') {
        convertedTime = `12${convertedTime.substring(1)}`;
    }
    return convertedTime;
}

function parseTimeblocks(timeBlocks: TimeblockInformation[]) {
    const timeBlockOptions = [];
    for (const timeBlock of timeBlocks) {
        timeBlockOptions.push({
            label: `${timeConversion(timeBlock.startsAt)} - ${timeConversion(timeBlock.endsAt)}`,
            value: `${timeConversion(timeBlock.startsAt)} - ${timeConversion(timeBlock.endsAt)}`,
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
                    avaliableTimeblocks = new MessageActionRow().addComponents(parseTimeblocks(await searchTimeblocks(menuInteraction.values[0], sectionInformation!, roomInformation!)));

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
