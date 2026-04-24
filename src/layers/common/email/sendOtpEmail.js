const getTransporter = require('./transporter')
const otpTemplate = require('./templates/otpTemplate')

async function sendWithRetry(fn, retries = 2) {
  try {
    return await fn()
  } catch (err) {
    if (retries === 0) throw err
    return sendWithRetry(fn, retries - 1)
  }
}

module.exports = async function sendOtpEmail(email, otp, channel = 'email') {
  const transporter = getTransporter()
  const from = process.env.BREVO_USER

  await sendWithRetry(() =>
    transporter.sendMail({
      from,
      to: email,
      subject: 'Your Login OTP',
      html: otpTemplate({ otp, channel }),
    })
  )
}
