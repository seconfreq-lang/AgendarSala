"use client"

import { useState, useEffect, useCallback } from 'react'
import { Room, Booking } from '@prisma/client'
import { format, addDays, subDays, startOfWeek, endOfWeek, addWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { TimeGrid } from './time-grid'
import { BookingList } from './booking-list'
import { BookingForm } from './booking-form'

import { getCurrentDateInSP, formatDateForDisplay } from '@/lib/timezone'

const roomLabels = {
  [Room.MACHADO]: 'Machado',
  [Room.FRANCA]: 'Franca',
  [Room.SANTOS]: 'Santos',
}

export function BookingPortal() {
  const [currentDate, setCurrentDate] = useState(() => getCurrentDateInSP())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rooms')
  const [activeRoom, setActiveRoom] = useState<Room>(Room.MACHADO)

  const fetchBookings = useCallback(async () => {
    try {
      // Fetch bookings for the current week + next week
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 })
      
      const response = await fetch(
        `/api/bookings?from=${format(weekStart, 'yyyy-MM-dd')}&to=${format(weekEnd, 'yyyy-MM-dd')}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      } else {
        console.error('Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(prev => subDays(prev, 1))
    } else {
      setCurrentDate(prev => addDays(prev, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(getCurrentDateInSP())
  }

  const upcomingBookings = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.date)
      return bookingDate >= getCurrentDateInSP()
    })
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime()
      }
      return a.startTime.localeCompare(b.startTime)
    })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Portal de Agendamento de Salas</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie reservas das salas Machado, Franca e Santos
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <BookingForm
                trigger={
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Novo Agendamento
                  </Button>
                }
                onSuccess={fetchBookings}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="rooms">
              <Calendar className="h-4 w-4 mr-2" />
              Salas
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              Agendamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Disponibilidade das Salas</CardTitle>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDate('prev')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={goToToday}
                        className="px-4"
                      >
                        Hoje
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDate('next')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-lg font-semibold">
                      {formatDateForDisplay(currentDate)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs value={activeRoom} onValueChange={(value) => setActiveRoom(value as Room)}>
                  <TabsList className="grid w-full grid-cols-3">
                    {Object.values(Room).map((room) => (
                      <TabsTrigger key={room} value={room}>
                        {roomLabels[room]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Object.values(Room).map((room) => (
                    <TabsContent key={room} value={room} className="mt-6">
                      <TimeGrid
                        room={room}
                        currentDate={currentDate}
                        bookings={bookings}
                        onRefresh={fetchBookings}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingList
                  bookings={upcomingBookings}
                  onRefresh={fetchBookings}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}