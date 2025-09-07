import { format, startOfDay, isBefore } from 'date-fns'

const TIMEZONE = 'America/Sao_Paulo'

export function getCurrentDateInSP(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }))
}

export function getStartOfDayInSP(date: Date): Date {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  return startOfDay(localDate)
}

export function formatDateForDisplay(date: Date): string {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  return format(localDate, 'dd/MM/yyyy')
}

export function formatDateTimeForStorage(date: Date): Date {
  // Return the date as-is for storage
  return date
}

export function parseDateTimeFromStorage(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
}

export function isDateInPast(date: Date): boolean {
  const today = getCurrentDateInSP()
  const startOfToday = startOfDay(today)
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const startOfDate = startOfDay(localDate)
  
  return isBefore(startOfDate, startOfToday)
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours, minutes }
}

export function isTimeInBusinessHours(timeStr: string): boolean {
  const { hours, minutes } = parseTimeString(timeStr)
  const totalMinutes = hours * 60 + minutes
  
  const businessStart = 8 * 60 // 08:00
  const businessEnd = 22 * 60 // 22:00
  
  return totalMinutes >= businessStart && totalMinutes <= businessEnd
}

export function generateTimeSlots(): string[] {
  const slots = []
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 22 && minute > 0) break // Don't go past 22:00
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeStr)
    }
  }
  return slots
}

export function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTimeString(timeStr)
  return hours * 60 + minutes
}

export function isValidTimeInterval(startTime: string, endTime: string): boolean {
  return timeToMinutes(startTime) < timeToMinutes(endTime)
}

export function doTimeSlotsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  
  // Two intervals [a,b) and [c,d) overlap if a < d and c < b
  return s1 < e2 && s2 < e1
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`
}

export function createDateFromDateAndTime(date: Date, timeStr: string): Date {
  const { hours, minutes } = parseTimeString(timeStr)
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  
  const newDate = new Date(localDate)
  newDate.setHours(hours, minutes, 0, 0)
  
  return newDate
}