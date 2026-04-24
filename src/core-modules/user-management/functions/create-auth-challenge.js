const sendOtpEmail = require('/opt/nodejs/email/sendOtpEmail')
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns')

const sns = new SNSClient({ region: process.env.AWS_REGION || 'ap-south-1' })

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function maskEmail(email) {
  const [local, domain] = email.split('@')
  return local.slice(0, 2) + '***@' + domain
}

function maskPhone(phone) {
  if (phone.length <= 6) return '***'
  return phone.slice(0, 3) + '****' + phone.slice(-3)
}

exports.handler = async (event) => {
  const session = event.request.session || []
  const attrs = event.request.userAttributes || {}
  const clientMetadata = event.request.clientMetadata || {}

  const email = attrs.email || ''
  const phone = attrs.phone_number || ''

  // ── Step 1: SELECT_CHANNEL — show available options to frontend ─────────────
  if (session.length === 0 || session[session.length - 1]?.challengeName === 'PASSWORD_VERIFIER') {
    event.response.publicChallengeParameters = {
      step: 'SELECT_CHANNEL',
      maskedEmail: email ? maskEmail(email) : '',
      maskedPhone: phone ? maskPhone(phone) : '',
      hasEmail: email ? 'true' : 'false',
      hasPhone: phone ? 'true' : 'false',
    }
    event.response.privateChallengeParameters = { step: 'SELECT_CHANNEL' }
    event.response.challengeMetadata = 'SELECT_CHANNEL'
    return event
  }

  // ── Step 2: VERIFY_OTP — generate OTP and send via chosen channel ───────────
  const channel = clientMetadata.channel || 'email'
  const otp = generateOTP()
  const otpExpiry = String(Date.now() + 5 * 60 * 1000) // 5 minutes

  if (channel === 'email' && email) {
    try {
      await sendOtpEmail(email, otp, 'email')
    } catch (err) {
      console.error('OTP email failed:', err.message)
    }
  } else if (channel === 'phone' && phone) {
    try {
      await sns.send(new PublishCommand({
        PhoneNumber: phone,
        Message: `Your login OTP is: ${otp}. Valid for 5 minutes. Do not share.`,
      }))
    } catch (err) {
      console.error('SNS SMS failed:', err.message)
    }
  }

  event.response.publicChallengeParameters = {
    step: 'VERIFY_OTP',
    channel,
    destination: channel === 'email' ? maskEmail(email) : maskPhone(phone),
  }
  event.response.privateChallengeParameters = { step: 'VERIFY_OTP', otp, otpExpiry }
  event.response.challengeMetadata = 'VERIFY_OTP'

  return event
}
