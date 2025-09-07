import { z } from 'zod'
import { Room } from '@prisma/client'
import { 
  isTimeInBusinessHours, 
  isValidTimeInterval, 
  doTimeSlotsOverlap,
  isDateInPast,
  getStartOfDayInSP
} from './timezone'

export const BookingSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  
  room: z.nativeEnum(Room, {
    errorMap: () => ({ message: 'Sala inválida' })
  }),
  
  date: z.date({
    errorMap: () => ({ message: 'Data inválida' })
  }).refine((date) => !isDateInPast(date), {
    message: 'Não é possível agendar em datas passadas'
  }),
  
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:mm)')
    .refine((time) => isTimeInBusinessHours(time), {
      message: 'Horário deve estar entre 08:00 e 22:00'
    }),
  
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:mm)')
    .refine((time) => isTimeInBusinessHours(time), {
      message: 'Horário deve estar entre 08:00 e 22:00'
    }),
}).refine((data) => isValidTimeInterval(data.startTime, data.endTime), {
  message: 'Horário de início deve ser anterior ao horário de fim',
  path: ['endTime']
})

export type BookingInput = z.infer<typeof BookingSchema>

export interface ExistingBooking {
  id: string
  room: Room
  date: Date
  startTime: string
  endTime: string
}

export function validateBookingConflict(
  newBooking: BookingInput,
  existingBookings: ExistingBooking[],
  excludeId?: string
): string | null {
  const conflictingBooking = existingBookings.find(booking => {
    // Skip if it's the same booking being edited
    if (excludeId && booking.id === excludeId) {
      return false
    }
    
    // Check if same room and same day
    if (booking.room !== newBooking.room) {
      return false
    }
    
    const bookingStartOfDay = getStartOfDayInSP(booking.date)
    const newBookingStartOfDay = getStartOfDayInSP(newBooking.date)
    
    if (bookingStartOfDay.getTime() !== newBookingStartOfDay.getTime()) {
      return false
    }
    
    // Check time overlap
    return doTimeSlotsOverlap(
      newBooking.startTime,
      newBooking.endTime,
      booking.startTime,
      booking.endTime
    )
  })
  
  if (conflictingBooking) {
    return `Conflito de horário: já existe um agendamento das ${conflictingBooking.startTime} às ${conflictingBooking.endTime}`
  }
  
  return null
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateTimeStep(timeStr: string): boolean {
  const [, minutesStr] = timeStr.split(':')
  const minutes = parseInt(minutesStr, 10)
  return minutes % 30 === 0 // Only allow 00 or 30 minutes
}