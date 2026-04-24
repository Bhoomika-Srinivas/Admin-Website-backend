/**
 * VerifyAuthChallenge — validates the user's response to each challenge:
 *
 *  SELECT_CHANNEL: answer must be 'email' (if they have email) or 'phone' (if they have phone)
 *  VERIFY_OTP:     answer must match the generated OTP and not be expired
 */
exports.handler = async (event) => {
  const privateParams = event.request.privateChallengeParameters || {}
  const attrs = event.request.userAttributes || {}
  const answer = (event.request.challengeAnswer || '').trim()

  if (privateParams.step === 'SELECT_CHANNEL') {
    // Valid if the chosen channel actually exists for this user
    if (answer === 'email' && attrs.email) {
      event.response.answerCorrect = true
    } else if (answer === 'phone' && attrs.phone_number) {
      event.response.answerCorrect = true
    } else {
      event.response.answerCorrect = false
    }
  } else if (privateParams.step === 'VERIFY_OTP') {
    const expectedOtp = privateParams.otp || ''
    const expiry = parseInt(privateParams.otpExpiry || '0', 10)
    event.response.answerCorrect = answer === expectedOtp && Date.now() < expiry
  } else {
    event.response.answerCorrect = false
  }

  return event
}
