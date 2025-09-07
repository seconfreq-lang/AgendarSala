import { Room } from '@prisma/client'

// Mock data for Vercel deployment (since SQLite doesn't work on serverless)
export const mockBookings = [
  {
    id: '1',
    name: 'Teste Machado',
    room: Room.MACHADO,
    date: new Date(),
    startTime: '10:00',
    endTime: '11:00',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Treinamento',
    room: Room.FRANCA,
    date: new Date(),
    startTime: '14:00',
    endTime: '15:30',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Reunião Comercial',
    room: Room.SANTOS,
    date: new Date(),
    startTime: '16:00',
    endTime: '17:00',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const isVercel = process.env.VERCEL === '1'