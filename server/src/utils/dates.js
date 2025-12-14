import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = process.env.DEFAULT_TZ || 'America/Merida';

export const nowUTC = () => dayjs().utc().toISOString();

export const convertToUTC = (dateString) => {
  const d = dateString ? dayjs(dateString) : dayjs();
  if (!d.isValid()) {
    return dayjs().utc().toISOString();
  }
  return d.utc().toISOString();
};

export const convertInputDateToSupabase = (inputDateString) => {
  const d = inputDateString ? dayjs(inputDateString, 'YYYY-MM-DD', true) : dayjs();
  return d.isValid() ? d.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
};

export const convertDateTimeToTimeZone = (dateString, tz = DEFAULT_TZ) => {
  if (!dateString) return null;
  const d = dayjs(dateString);
  if (!d.isValid()) return dateString;
  return d.tz(tz).toISOString();
};

export const convertSupabaseDateToInput = (dateString) => {
  if (!dateString) return '';
  return dayjs(dateString).format('YYYY-MM-DD');
};
