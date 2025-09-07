"use client"

import { useState } from 'react'
import { Room, Booking } from '@prisma/client'
import { format } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { BookingSchema, BookingInput } from '@/lib/validation'
import { generateTimeSlots } from '@/lib/timezone'

interface BookingFormProps {
  trigger: React.ReactNode
  initialData?: {
    room?: Room
    date?: Date
    startTime?: string
    endTime?: string
  }
  editingBooking?: Booking
  onSuccess?: () => void
}

const roomLabels = {
  [Room.MACHADO]: 'Machado',
  [Room.FRANCA]: 'Franca',
  [Room.SANTOS]: 'Santos',
}

export function BookingForm({
  trigger,
  initialData,
  editingBooking,
  onSuccess,
}: BookingFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const timeSlots = generateTimeSlots()

  const form = useForm<BookingInput>({
    resolver: zodResolver(BookingSchema),
    defaultValues: {
      name: editingBooking?.name || '',
      room: initialData?.room || editingBooking?.room || Room.MACHADO,
      date: initialData?.date || (editingBooking ? new Date(editingBooking.date) : new Date()),
      startTime: initialData?.startTime || editingBooking?.startTime || '09:00',
      endTime: initialData?.endTime || editingBooking?.endTime || '10:00',
    },
  })

  async function onSubmit(data: BookingInput) {
    setIsLoading(true)
    
    try {
      const url = editingBooking 
        ? `/api/bookings/${editingBooking.id}`
        : '/api/bookings'
      
      const method = editingBooking ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: data.date.toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          result.details.forEach((detail: { field: string; message: string }) => {
            form.setError(detail.field as keyof BookingInput, {
              type: 'manual',
              message: detail.message,
            })
          })
        } else {
          toast.error(result.error || 'Erro ao salvar agendamento')
        }
        return
      }

      toast.success(editingBooking ? 'Agendamento atualizado!' : 'Agendamento criado!')
      setOpen(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Erro interno. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingBooking ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Solicitante</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu nome..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma sala" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Room).map((room) => (
                        <SelectItem key={room} value={room}>
                          {roomLabels[room]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={format(field.value, 'yyyy-MM-dd')}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Fim</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : editingBooking ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}