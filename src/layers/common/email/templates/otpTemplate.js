module.exports = function otpTemplate({ otp, channel, appName = 'College Portal' }) {
  return `
    <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;color:#222">
      <h2 style="margin-bottom:8px">${appName}</h2>
      <p style="color:#555;margin-bottom:24px">Use the OTP below to complete your sign in via <strong>${channel}</strong>.</p>
      <div style="background:#f4f4f4;border-radius:8px;padding:24px;text-align:center">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#111">${otp}</span>
      </div>
      <p style="color:#999;font-size:13px;margin-top:16px">Valid for 5 minutes. Do not share this with anyone.</p>
    </div>
  `
}
