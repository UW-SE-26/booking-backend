export interface Schedule {
    // Number from 0-6 representing the week day where Sunday = 0, Monday = 1 ... Saturday = 6
    dayOfWeek: number;
    // Number from 0-23 representing the hour on the dayOfWeek that the room opens in ET
    start: number;
    // Number from 0-23 representing the hour of the dayOfWeek that the room closes in ET
    end: number;
}
