import { getTodayInTimeZone, isValidDateOnly } from "@/lib/tracking/date";

const DAY_MS = 24 * 60 * 60 * 1000;

export { isValidDateOnly };

/*
|--------------------------------------------------------------------------
| DIFERENCIA DÍAS
|--------------------------------------------------------------------------
*/

export function countInclusiveDays(from: string, to: string) {
  const start = new Date(`${from}T00:00:00.000Z`);

  const end = new Date(`${to}T00:00:00.000Z`);

  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

/*
|--------------------------------------------------------------------------
| FECHA TIMESTAMP → FECHA EMPRESA
|--------------------------------------------------------------------------
*/

export function formatDateInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,

    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

/*
|--------------------------------------------------------------------------
| RANGO POR DEFECTO
|--------------------------------------------------------------------------
|
| Mes actual hasta hoy.
|
*/

export function getDefaultRecoveryRange(timeZone: string) {
  const to = getTodayInTimeZone(timeZone);

  const from = `${to.slice(0, 7)}-01`;

  return {
    from,
    to,
  };
}

/*
|--------------------------------------------------------------------------
| DESPLAZAR UN MES
|--------------------------------------------------------------------------
|
| 31/03 -> 28/02
| 30/09 -> 30/08
|
*/

export function shiftDateOnlyMonths(value: string, months: number) {
  const [year, month, day] = value.split("-").map(Number);

  const targetBase = new Date(Date.UTC(year, month - 1 + months, 1));

  const targetYear = targetBase.getUTCFullYear();

  const targetMonth = targetBase.getUTCMonth();

  const lastDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();

  const resolvedDay = Math.min(day, lastDay);

  return new Date(Date.UTC(targetYear, targetMonth, resolvedDay))
    .toISOString()
    .slice(0, 10);
}
