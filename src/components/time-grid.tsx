"use client"

import { useMemo } from 'react'
import { Room, Booking } from '@prisma/client'
import { format, addDays, isSameDay } from 'date-fns'
import { Plus, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BookingForm } from './booking-form'

import { 
  generateTimeSlots, 
  formatTimeRange, 
  doTimeSlotsOverlap,
  getStartOfDayInSP 
} from '@/lib/timezone'

interface TimeGridProps {
  room: Room
  currentDate: Date
  bookings: Booking[]
  onRefresh: () => void
}

const roomLabels = {
  [Room.MACHADO]: 'Machado',
  [Room.FRANCA]: 'Franca',
  [Room.SANTOS]: 'Santos',
}

export function TimeGrid({ room, currentDate, bookings, onRefresh }: TimeGridProps) {
  const timeSlots = generateTimeSlots()
  
  const dayBookings = useMemo(() => {
    const startOfDay = getStartOfDayInSP(currentDate)
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date)
      return booking.room === room && isSameDay(bookingDate, startOfDay)
    })
  }, [bookings, room, currentDate])

  function isSlotOccupied(timeSlot: string): Booking | null {
    // Check if any booking overlaps with this 30-minute slot
    const slotEndTime = generateTimeSlots()[generateTimeSlots().indexOf(timeSlot) + 1] || '22:30'
    
    return dayBookings.find(booking => {
      return doTimeSlotsOverlap(
        timeSlot,
        slotEndTime,
        booking.startTime,
        booking.endTime
      )
    }) || null
  }

  function getSlotBooking(timeSlot: string): Booking | null {
    return dayBookings.find(booking => booking.startTime === timeSlot) || null
  }

  function calculateBookingSpan(booking: Booking): number {
    const startIndex = timeSlots.indexOf(booking.startTime)
    const endIndex = timeSlots.findIndex(slot => slot >= booking.endTime)
    
    if (startIndex === -1) return 1
    if (endIndex === -1) return timeSlots.length - startIndex
    
    return endIndex - startIndex
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Sala {roomLabels[room]} - {format(currentDate, 'dd/MM/yyyy')}
        </h3>
        <div className="text-sm text-muted-foreground">
          {dayBookings.length} agendamento{dayBookings.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="grid gap-1 min-h-[600px]">
        {timeSlots.map((timeSlot, index) => {
          const slotBooking = getSlotBooking(timeSlot)
          const isOccupied = isSlotOccupied(timeSlot)
          
          if (slotBooking) {
            const span = calculateBookingSpan(slotBooking)
            
            return (
              <div
                key={timeSlot}
                className="relative bg-blue-100 border border-blue-300 rounded-lg p-3 min-h-[60px]"
                style={{ 
                  gridRow: `span ${span}`,
                  minHeight: `${span * 60}px`
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      {formatTimeRange(slotBooking.startTime, slotBooking.endTime)}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-blue-900 truncate">
                      {slotBooking.name}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <BookingForm
                      trigger={
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <span className="sr-only">Editar</span>
                          ✏️
                        </Button>
                      }
                      editingBooking={slotBooking}
                      onSuccess={onRefresh}
                    />
                  </div>
                </div>
              </div>
            )
          }
          
          if (isOccupied) {
            // This slot is occupied by a booking that started earlier, render empty
            return null
          }
          
          // Available slot
          const nextTimeSlot = timeSlots[index + 1] || '22:30'
          
          return (
            <div
              key={timeSlot}
              className="relative border border-dashed border-gray-300 rounded-lg p-2 min-h-[60px] hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center justify-between h-full">
                <span className="text-sm text-muted-foreground font-mono">
                  {timeSlot}
                </span>
                <BookingForm
                  trigger={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Agendar</span>
                    </Button>
                  }
                  initialData={{
                    room,
                    date: currentDate,
                    startTime: timeSlot,
                    endTime: nextTimeSlot,
                  }}
                  onSuccess={onRefresh}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}