import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { BookingSchema, validateBookingConflict, ValidationError } from '@/lib/validation'
import { getStartOfDayInSP, formatDateTimeForStorage } from '@/lib/timezone'
import { mockBookings, isVercel } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings - Environment check:', {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      isVercel
    })
    
    // Always use mock data in production/Vercel
    if (isVercel) {
      console.log('Using mock data for Vercel/production')
      return NextResponse.json({ bookings: mockBookings })
    }
    
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    if (!from || !to) {
      return NextResponse.json(
        { error: 'Parâmetros from e to são obrigatórios' },
        { status: 400 }
      )
    }
    
    const startOfFromDate = getStartOfDayInSP(fromDate)
    const startOfToDate = getStartOfDayInSP(toDate)
    
    // Add one day to include the end date
    const endDate = new Date(startOfToDate)
    endDate.setDate(endDate.getDate() + 1)
    
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: formatDateTimeForStorage(startOfFromDate),
          lt: formatDateTimeForStorage(endDate),
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    })
    
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/bookings - Environment check:', { isVercel })
    
    const body = await request.json()
    console.log('POST body:', body)
    
    // On Vercel (demo), simulate creation but return mock data
    if (isVercel) {
      console.log('Creating mock booking for Vercel')
      
      // Return a mock created booking without complex validation
      const booking = {
        id: Date.now().toString(),
        name: body.name || 'Mock User',
        room: body.room || 'MACHADO',
        date: new Date(),
        startTime: body.startTime || '09:00',
        endTime: body.endTime || '10:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      console.log('Returning mock booking:', booking)
      return NextResponse.json({ booking }, { status: 201 })
    }
    
    // Parse and validate the input for local development
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
    
    // Local database logic
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
      },
    })
    
    // Check for conflicts
    const conflictError = validateBookingConflict(validatedData, existingBookings)
    if (conflictError) {
      return NextResponse.json(
        { error: conflictError },
        { status: 409 }
      )
    }
    
    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        name: validatedData.name,
        room: validatedData.room,
        date: formatDateTimeForStorage(getStartOfDayInSP(validatedData.date)),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
      },
    })
    
    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    
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