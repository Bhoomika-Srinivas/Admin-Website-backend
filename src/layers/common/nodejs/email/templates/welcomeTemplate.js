module.exports = function welcomeTemplate({ name, email, password, role, departmentName, collegeName, appUrl }) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;color:#222">
      <h2 style="margin-bottom:4px">Welcome to ${collegeName}</h2>
      <p style="color:#555;margin-bottom:24px">Hi ${name}, you have been added as <strong>${role}</strong>. Here are your login details:</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:8px 0;color:#888;width:140px">Login URL</td><td><a href="${appUrl}">${appUrl}</a></td></tr>
        <tr><td style="padding:8px 0;color:#888">Email</td><td>${email}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Password</td><td><strong>${password}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#888">Role</td><td>${role}</td></tr>
        ${departmentName ? `<tr><td style="padding:8px 0;color:#888">Department</td><td>${departmentName}</td></tr>` : ''}
      </table>
      <p style="color:#999;font-size:13px">Please log in and change your password after your first sign-in.</p>
    </div>
  `
}
