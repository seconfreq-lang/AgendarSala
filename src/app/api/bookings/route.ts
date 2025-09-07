import { NextRequest, NextResponse } from 'next/server'
import { mockBookings, isVercel } from '@/lib/mock-data'

// Only import these in development (when not on Vercel)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BookingSchema: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let validateBookingConflict: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ValidationError: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getStartOfDayInSP: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let formatDateTimeForStorage: any = null

if (!isVercel) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dbModule = require('@/lib/db')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const validationModule = require('@/lib/validation')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const timezoneModule = require('@/lib/timezone')
    
    prisma = dbModule.prisma
    BookingSchema = validationModule.BookingSchema
    validateBookingConflict = validationModule.validateBookingConflict
    ValidationError = validationModule.ValidationError
    getStartOfDayInSP = timezoneModule.getStartOfDayInSP
    formatDateTimeForStorage = timezoneModule.formatDateTimeForStorage
  } catch {
    console.log('Dev modules not loaded, using production mode')
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings - Environment check:', {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      isVercel
    })
    
    // Always use mock data on Vercel
    if (isVercel) {
      console.log('Using mock data for Vercel')
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
    
    const fromDate = new Date(from)
    const toDate = new Date(to)
    
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
      
      // Simple validation for demo - just check required fields
      if (!body.name || !body.room || !body.date || !body.startTime || !body.endTime) {
        return NextResponse.json(
          { error: 'Campos obrigatórios: name, room, date, startTime, endTime' },
          { status: 400 }
        )
      }
      
      // Return a mock created booking without complex validation
      const booking = {
        id: Date.now().toString(),
        name: body.name,
        room: body.room,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
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