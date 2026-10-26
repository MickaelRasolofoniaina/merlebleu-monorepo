export const formatDate = (value: Date | null): string => {
  if (!value) {
    return '';
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const addDays = (value: Date, days: number): Date => {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatTime = (value: Date | null): string => {
  if (!value) {
    return '';
  }

  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const parseTime = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const result = new Date();
  result.setHours(hours, minutes, 0, 0);
  return result;
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatNotificationDate = (value: string): string => {
  const date = new Date(value);
  const now = new Date();
  const time = formatTime(date);

  if (isSameDay(date, now)) {
    return `Aujourd'hui à ${time}`;
  }

  const yesterday = addDays(now, -1);
  if (isSameDay(date, yesterday)) {
    return `Hier à ${time}`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year} à ${time}`;
};
