import dayjs from "dayjs";
import { get } from "svelte/store";

import { isDate, type DataRecord } from "src/lib/dataframe/dataframe";
import { i18n } from "src/lib/stores/i18n";

export type CalendarInterval = "month" | "2weeks" | "week" | "3days" | "day";

export function isCalendarInterval(value: string): value is CalendarInterval {
  switch (value) {
    case "month":
    case "2weeks":
    case "week":
    case "3days":
    case "day":
      return true;
    default:
      return false;
  }
}

export function addInterval(
  date: dayjs.Dayjs,
  interval: CalendarInterval
): dayjs.Dayjs {
  switch (interval) {
    case "month":
      return date.add(1, "month");
    case "2weeks":
      return date.add(2, "week");
    case "week":
      return date.add(1, "week");
    case "3days":
      return date.add(1, "day");
    case "day":
      return date.add(1, "day");
  }
}

export function subtractInterval(
  date: dayjs.Dayjs,
  interval: CalendarInterval
): dayjs.Dayjs {
  switch (interval) {
    case "month":
      return date.subtract(1, "month");
    case "2weeks":
      return date.subtract(2, "week");
    case "week":
      return date.subtract(1, "week");
    case "3days":
      return date.subtract(1, "day");
    case "day":
      return date.subtract(1, "day");
  }
}

export function groupRecordsByField(
  records: DataRecord[],
  startDateField: string,
  endDateField?: string
): Record<string, DataRecord[]> {
  const res: Record<string, DataRecord[]> = {};

  records.forEach((record) => {
    const dateValue = record.values[startDateField];
    const endDateValue = endDateField != undefined ? record.values[endDateField] : null;

    const start = dateValue
      ? isDate(dateValue)
        ? dayjs(dateValue)
        : null
      : null;

    const end = dateValue ? isDate(endDateValue) ? dayjs(endDateValue) : null : null;

    if (start && end == null) {
      const dateStr = start.format("YYYY-MM-DD");
      if (!(dateStr in res)) {
        res[dateStr] = [];
      }

      res[dateStr]?.push(record);

    } else if (start && end?.isAfter(start, "day")) {
      for (
        let date = start;
        date.isSame(end, "day") || date.isBefore(end, "day");
        date = date.add(1, "day")
      ) {
        const dateStr = date.format("YYYY-MM-DD");
        if (!(dateStr in res)) {
          res[dateStr] = [];
        }

        res[dateStr]?.push(record);
      }
    }

  });

  return res;
}

export function computeDateInterval(
  anchor: dayjs.Dayjs,
  interval: CalendarInterval
): [dayjs.Dayjs, dayjs.Dayjs] {
  switch (interval) {
    case "month":
      return [
        anchor.startOf("month").startOf("isoWeek"),
        anchor.endOf("month").endOf("isoWeek"),
      ];
    case "2weeks":
      return [
        anchor.startOf("isoWeek"),
        anchor.add(1, "week").endOf("isoWeek"),
      ];
    case "week":
      return [anchor.startOf("isoWeek"), anchor.endOf("isoWeek")];
    case "3days":
      return [anchor, anchor.add(2, "days")];
    case "day":
      return [anchor, anchor];
  }
}

export function generateTitle(dateInterval: [dayjs.Dayjs, dayjs.Dayjs]) {
  if (dateInterval[0].startOf("day").isSame(dateInterval[1].startOf("day"))) {
    return get(i18n).t("views.calendar.date", {
      value: dateInterval[0],
      formatParams: {
        value: { year: "numeric", month: "long", day: "numeric" },
      },
    });
  }

  if (dateInterval[0].startOf("year").isSame(dateInterval[1].startOf("year"))) {
    return get(i18n).t("views.calendar.interval", {
      from: dateInterval[0],
      to: dateInterval[1],
      en_separator: ", ",
      custom_year: dateInterval[0],
      formatParams: {
        from: { month: "short", day: "numeric" },
        to: { month: "short", day: "numeric" },
        custom_year: { year: "numeric" },
      },
    });
  }

  return get(i18n).t("views.calendar.interval", {
    from: dateInterval[0],
    to: dateInterval[1],
    en_separator: "",
    custom_year: "",
    formatParams: {
      from: { year: "numeric", month: "short", day: "numeric" },
      to: { year: "numeric", month: "short", day: "numeric" },
      custom_year: { year: false },
    },
  });
}

export function generateDates(
  dateInterval: [dayjs.Dayjs, dayjs.Dayjs]
): dayjs.Dayjs[] {
  const dates: dayjs.Dayjs[] = [];

  const numDays = dateInterval[1].diff(dateInterval[0], "days");

  for (let i = 0; i <= numDays; i++) {
    dates.push(dateInterval[0].add(i, "day"));
  }

  return dates;
}

export function chunkDates(
  dates: dayjs.Dayjs[],
  chunks: number
): dayjs.Dayjs[][] {
  const chunkedDates: dayjs.Dayjs[][] = [];

  let rest = dates;
  while (rest.length) {
    const chunked = take(rest, chunks);

    chunkedDates.push(chunked);

    rest = rest.slice(chunked.length);
  }

  return chunkedDates;
}

function take<T>(arr: Array<T>, num: number): Array<T> {
  const buffer: Array<T> = [];
  for (let i = 0; i < num && i < arr.length; i++) {
    const el = arr[i];

    if (el) {
      buffer.push(el);
    }
  }
  return buffer;
}
