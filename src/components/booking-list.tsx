"use client"

import { useState } from 'react'
import { Room, Booking } from '@prisma/client'
import { format } from 'date-fns'
import { Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { BookingForm } from './booking-form'
import { formatTimeRange, parseDateTimeFromStorage } from '@/lib/timezone'

interface BookingListProps {
  bookings: Booking[]
  onRefresh: () => void
}

const roomLabels = {
  [Room.MACHADO]: 'Machado',
  [Room.FRANCA]: 'Franca',
  [Room.SANTOS]: 'Santos',
}

export function BookingList({ bookings, onRefresh }: BookingListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  async function handleDelete(booking: Booking) {
    if (deletingIds.has(booking.id)) return

    setDeletingIds(prev => new Set([...prev, booking.id]))
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || 'Erro ao cancelar agendamento')
        return
      }

      toast.success('Agendamento cancelado!')
      onRefresh()
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('Erro interno. Tente novamente.')
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(booking.id)
        return newSet
      })
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum agendamento encontrado
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Próximos Agendamentos ({bookings.length})
      </h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Sala</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const bookingDate = parseDateTimeFromStorage(new Date(booking.date))
            const isDeleting = deletingIds.has(booking.id)
            
            return (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.name}</TableCell>
                <TableCell>{roomLabels[booking.room]}</TableCell>
                <TableCell>{format(bookingDate, 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  {formatTimeRange(booking.startTime, booking.endTime)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <BookingForm
                      trigger={
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isDeleting}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      }
                      editingBooking={booking}
                      onSuccess={onRefresh}
                    />
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isDeleting}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Cancelar</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar o agendamento de{' '}
                            <strong>{booking.name}</strong> na sala{' '}
                            <strong>{roomLabels[booking.room]}</strong> no dia{' '}
                            <strong>{format(bookingDate, 'dd/MM/yyyy')}</strong> das{' '}
                            <strong>
                              {formatTimeRange(booking.startTime, booking.endTime)}
                            </strong>?
                            <br />
                            <br />
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Não, manter</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(booking)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? 'Cancelando...' : 'Sim, cancelar'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}