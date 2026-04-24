const { withConnection } = require('/opt/nodejs/middleware/with-connection')
const { Event } = require('../schemas/events.model')

async function handleSchedule() {
  const today = new Date().toISOString().slice(0, 10)
  await Event.updateMany(
    {
      status: 'upcoming',
      $or: [
        { isMultiDay: false, date:    { $lt: today } },
        { isMultiDay: true,  endDate: { $lt: today } },
      ],
    },
    { $set: { status: 'completed' } }
  )
}

exports.handler = withConnection(handleSchedule)
