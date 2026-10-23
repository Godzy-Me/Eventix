import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { config } from "../config/config";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/** Shows store date as "DD-MM-YYYY" and startTime as "07:30 PM" (cinema local time). */
export const getShowStart = (date: string, startTime: string) =>
  dayjs.tz(`${date} ${startTime}`, "DD-MM-YYYY hh:mm A", config.showTimezone);

export const hasShowStarted = (date: string, startTime: string): boolean => {
  const start = getShowStart(date, startTime);
  if (!start.isValid()) return false;
  return dayjs().isAfter(start);
};
