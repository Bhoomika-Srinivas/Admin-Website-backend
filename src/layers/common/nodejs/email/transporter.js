const nodemailer = require('nodemailer')

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter

  const user = process.env.BREVO_USER
  const pass = process.env.BREVO_PASS

  if (!user || !pass) throw new Error('BREVO_USER or BREVO_PASS not set')

  _transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  })

  return _transporter
}

module.exports = getTransporter
