import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { BookingSchema, validateBookingConflict, ValidationError } from '@/lib/validation'
import { getStartOfDayInSP, formatDateTimeForStorage } from '@/lib/timezone'
import { isVercel } from '@/lib/mock-data'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // On Vercel, return mock success response
    if (isVercel) {
      return NextResponse.json({
        booking: {
          id,
          ...body,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
    }
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    })
    
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }
    
    // Parse and validate the input
    const result = BookingSchema.safeParse({
      ...body,
      date: new Date(body.date),
    })
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: result.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      )
    }
    
    const validatedData = result.data
    
    // Get existing bookings for conflict check (excluding current booking)
    const startOfDay = getStartOfDayInSP(validatedData.date)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)
    
    const existingBookings = await prisma.booking.findMany({
      where: {
        room: validatedData.room,
        date: {
          gte: formatDateTimeForStorage(startOfDay),
          lt: formatDateTimeForStorage(endOfDay),
        },
        NOT: { id }, // Exclude current booking from conflict check
      },
    })
    
    // Check for conflicts
    const conflictError = validateBookingConflict(validatedData, existingBookings, id)
    if (conflictError) {
      return NextResponse.json(
        { error: conflictError },
        { status: 409 }
      )
    }
    
    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        name: validatedData.name,
        room: validatedData.room,
        date: formatDateTimeForStorage(getStartOfDayInSP(validatedData.date)),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
      },
    })
    
    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Error updating booking:', error)
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // On Vercel, return mock success response
    if (isVercel) {
      return NextResponse.json({ success: true })
    }
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    })
    
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }
    
    // Delete the booking
    await prisma.booking.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}