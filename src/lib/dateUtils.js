import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const DEFAULT_TZ = 'America/Merida';

export const convertToUTC = (dateString) => {
  const d = dateString ? dayjs(dateString) : dayjs();
  if (!d.isValid()) {
    console.warn(`Invalid dateString for convertToUTC: ${dateString}. Using now.`);
    return dayjs().utc().toISOString();
  }
  return d.utc().toISOString();
};

export const convertDateTimeToTimeZone = (dateString, timeZone = DEFAULT_TZ) => {
  if (!dateString) return dayjs().tz(timeZone).toISOString();
  const d = dayjs(dateString);
  if (!d.isValid()) {
    console.warn(`Invalid dateString for convertDateTimeToTimeZone: ${dateString}. Returning as is.`);
    return dateString;
  }
  return d.tz(timeZone).toISOString();
};

// For DATE (no time) columns, ensure consistent YYYY-MM-DD handling
export const convertInputDateToSupabase = (inputDateString) => {
  if (!inputDateString) return dayjs().format('YYYY-MM-DD');
  const d = dayjs(inputDateString, 'YYYY-MM-DD', true);
  if (!d.isValid()) {
    console.warn(`Invalid inputDateString for convertInputDateToSupabase: ${inputDateString}. Using today.`);
    return dayjs().format('YYYY-MM-DD');
  }
  return d.format('YYYY-MM-DD');
};

export const convertSupabaseDateToInput = (supabaseDateString) => {
  if (!supabaseDateString) return '';
  // If backend accidentally returns a datetime, strip time
  if (typeof supabaseDateString === 'string' && supabaseDateString.includes('T')) {
    return supabaseDateString.split('T')[0];
  }
  return supabaseDateString;
};

export const formatDateForDisplay = (dateString, timeZone = DEFAULT_TZ) => {
  if (!dateString) return 'Fecha no disponible';
  // Accept both date and datetime
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? dayjs.tz(`${dateString}T00:00:00`, timeZone)
    : dayjs(dateString).tz(timeZone);
  if (!d.isValid()) {
    console.warn(`Invalid date for formatDateForDisplay. Original: "${dateString}"`);
    return 'Fecha Inválida';
  }
  // Spanish long date
  return d.format('D [de] MMMM [de] YYYY');
};