const getTransporter = require('./transporter')
const welcomeTemplate = require('./templates/welcomeTemplate')

async function sendWithRetry(fn, retries = 2) {
  try {
    return await fn()
  } catch (err) {
    if (retries === 0) throw err
    return sendWithRetry(fn, retries - 1)
  }
}

module.exports = async function sendWelcomeEmail({ name, email, password, role, departmentName, collegeName, appUrl }) {
  const transporter = getTransporter()
  const from = process.env.BREVO_FROM || process.env.BREVO_USER

  await sendWithRetry(() =>
    transporter.sendMail({
      from,
      to: email,
      subject: `Welcome to ${collegeName}`,
      html: welcomeTemplate({ name, email, password, role, departmentName, collegeName, appUrl }),
    })
  )
}
