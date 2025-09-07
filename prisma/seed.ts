import { PrismaClient } from '@prisma/client'
import { Room } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')
  
  // Get current date and start of day in local timezone
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  // Clear existing bookings
  await prisma.booking.deleteMany()
  console.log('Cleared existing bookings')

  // Create sample bookings for today
  const bookings = [
    {
      name: 'Teste Machado',
      room: Room.MACHADO,
      date: startOfToday,
      startTime: '10:00',
      endTime: '11:00',
    },
    {
      name: 'Treinamento',
      room: Room.FRANCA,
      date: startOfToday,
      startTime: '14:00',
      endTime: '15:30',
    },
    {
      name: 'Reunião Comercial',
      room: Room.SANTOS,
      date: startOfToday,
      startTime: '16:00',
      endTime: '17:00',
    },
  ]

  for (const booking of bookings) {
    const created = await prisma.booking.create({
      data: booking,
    })
    console.log(`Created booking: ${created.name} in ${created.room} on ${created.startTime}-${created.endTime}`)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })