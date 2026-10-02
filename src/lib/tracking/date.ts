const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOnly(value: string) {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/*
|--------------------------------------------------------------------------
| HOY EN LA ZONA HORARIA DE LA EMPRESA
|--------------------------------------------------------------------------
*/

export function getTodayInTimeZone(timeZone: string, now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,

    year: "numeric",

    month: "2-digit",

    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return now.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

/*
|--------------------------------------------------------------------------
| DIFERENCIA ENTRE DOS DATE-ONLY
|--------------------------------------------------------------------------
*/

export function differenceInDateOnlyDays(
  laterDate: string,
  earlierDate: string,
) {
  const later = new Date(`${laterDate}T00:00:00.000Z`);

  const earlier = new Date(`${earlierDate}T00:00:00.000Z`);

  const dayMs = 24 * 60 * 60 * 1000;

  return Math.max(Math.floor((later.getTime() - earlier.getTime()) / dayMs), 0);
}
