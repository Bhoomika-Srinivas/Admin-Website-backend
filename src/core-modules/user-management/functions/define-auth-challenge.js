/**
 * DefineAuthChallenge — orchestrates the custom auth flow:
 *
 * Flow (after password verified via SRP/plain):
 *   Step 1: Issue SELECT_CHANNEL challenge (choose email or phone)
 *   Step 2: Issue VERIFY_OTP challenge (enter the OTP)
 *   Done:   Issue tokens
 */
exports.handler = async (event) => {
  const session = event.request.session || []

  // Block unknown users immediately
  if (event.request.userNotFound) {
    event.response.failAuthentication = true
    event.response.issueTokens = false
    return event
  }

  const lastChallenge = session[session.length - 1]

  // ── No session yet, or password just verified ──────────────────────────────
  if (session.length === 0 || lastChallenge?.challengeName === 'PASSWORD_VERIFIER') {
    if (lastChallenge?.challengeName === 'PASSWORD_VERIFIER' && !lastChallenge.challengeResult) {
      // Wrong password
      event.response.failAuthentication = true
      event.response.issueTokens = false
    } else {
      // Password OK (or CUSTOM_AUTH with no password step) → ask for channel
      event.response.challengeName = 'CUSTOM_CHALLENGE'
      event.response.issueTokens = false
      event.response.failAuthentication = false
    }
    return event
  }

  // ── Previous challenge was a CUSTOM_CHALLENGE ───────────────────────────────
  if (lastChallenge?.challengeName === 'CUSTOM_CHALLENGE') {
    if (!lastChallenge.challengeResult) {
      // Wrong answer (bad channel or bad OTP)
      event.response.failAuthentication = true
      event.response.issueTokens = false
      return event
    }

    if (lastChallenge.challengeMetadata === 'SELECT_CHANNEL') {
      // Channel was selected → now verify OTP
      event.response.challengeName = 'CUSTOM_CHALLENGE'
      event.response.issueTokens = false
      event.response.failAuthentication = false
    } else if (lastChallenge.challengeMetadata === 'VERIFY_OTP') {
      // OTP correct → issue tokens
      event.response.issueTokens = true
      event.response.failAuthentication = false
    } else {
      event.response.failAuthentication = true
      event.response.issueTokens = false
    }
    return event
  }

  // Unknown state — fail safe
  event.response.failAuthentication = true
  event.response.issueTokens = false
  return event
}
