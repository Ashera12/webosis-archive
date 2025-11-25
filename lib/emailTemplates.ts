interface VerificationEmailParams {
  verificationLink: string;
  name?: string | null;
  firstTime?: boolean; // true on initial registration
  lang?: 'id' | 'en'; // default: id
  variant?: 'modern' | 'minimal'; // default: modern
  logoUrl?: string; // optional logo URL
}
interface ResetEmailParams {
  resetLink: string;
  name?: string | null;
  lang?: 'id' | 'en';
  variant?: 'modern' | 'minimal';
  logoUrl?: string;
}

export function buildVerificationEmail(params: VerificationEmailParams) {
  const { verificationLink, name, firstTime, lang = 'id', variant = 'modern', logoUrl } = params;
  const displayName = name && name.trim().length > 0 ? name.trim() : (lang === 'en' ? 'OSIS Member' : 'Sahabat OSIS');
  
  const copy = lang === 'en' ? {
    subjectFirst: 'Welcome! Verify Your OSIS Account',
    subjectResend: 'Re-verify Your OSIS Account – New Link',
    greeting: `Hello ${displayName}`,
    introFirst: 'Thank you for registering with OSIS Management System.',
    introResend: 'Here is your latest verification link.',
    instruction: 'Please click the link below (valid for 24 hours):',
    btnText: 'Verify Email',
    fallbackText: 'If the button doesn\'t work, copy this link to your browser:',
    securityTitle: 'Security tips:',
    securityTips: ['Don\'t forward this email to others.', 'Link will expire automatically after 24 hours.', 'If you didn\'t request this, ignore this email.'],
    signature: 'Warm regards,',
    team: 'OSIS SMK Informatika FI Team',
    footer: 'This email is sent automatically by OSIS internal system. Please do not reply directly.',
    copyright: 'OSIS SMK Informatika Fithrah Insani',
    headingFirst: 'Activate Your Account',
    headingResend: 'Re-verify Account'
  } : {
    subjectFirst: 'Selamat Datang! Verifikasi Email Akun OSIS Anda',
    subjectResend: 'Verifikasi Ulang Akun OSIS – Tautan Terbaru',
    greeting: `Halo ${displayName}`,
    introFirst: 'Terima kasih telah mendaftar di Sistem Manajemen OSIS.',
    introResend: 'Berikut tautan verifikasi terbaru untuk akun Anda.',
    instruction: 'Klik tombol di bawah ini untuk menyelesaikan verifikasi email (berlaku 24 jam):',
    btnText: 'Verifikasi Email',
    fallbackText: 'Jika tombol tidak bekerja, salin tautan berikut ke browser Anda:',
    securityTitle: 'Tips keamanan:',
    securityTips: ['Jangan teruskan email ini ke orang lain.', 'Tautan akan kadaluarsa otomatis setelah 24 jam.', 'Jika Anda tidak meminta ini, abaikan email ini.'],
    signature: 'Hangat,',
    team: 'Tim OSIS SMK Informatika Fithrah Insani',
    footer: 'Email ini dikirim otomatis oleh sistem internal OSIS. Mohon tidak membalas langsung pesan ini.',
    copyright: 'OSIS SMK Informatika Fithrah Insani',
    headingFirst: 'Aktifkan Akun Anda',
    headingResend: 'Verifikasi Ulang Akun'
  };
  
  const subject = firstTime ? copy.subjectFirst : copy.subjectResend;
  const text = `${copy.greeting},\n\n${firstTime ? copy.introFirst : copy.introResend}\n${copy.instruction}\n${verificationLink}\n\n${copy.securityTitle}\n${copy.securityTips.map(t => `• ${t}`).join('\n')}\n\n${copy.signature}\n${copy.team}`;

  if (variant === 'minimal') {
    const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title><style>body{margin:0;padding:20px;font-family:Arial,sans-serif;background:#fafafa;color:#333;line-height:1.6}.container{max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e0e0e0;border-radius:8px}.logo{text-align:center;margin-bottom:24px}.logo img{max-width:120px;height:auto}h1{font-size:20px;margin:0 0 16px;color:#222}.btn{display:inline-block;background:#ff7a1f;color:#fff!important;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;margin:16px 0}.link{word-break:break-all;font-size:13px;color:#666;background:#f5f5f5;padding:10px;border-radius:4px;margin:12px 0}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:12px;color:#999;text-align:center}@media (prefers-color-scheme:dark){body{background:#1a1a1a;color:#ddd}.container{background:#2a2a2a;border-color:#444}h1{color:#fff}.link{background:#333;color:#ccc}.footer{border-color:#444;color:#888}}</style></head><body><div class="container">${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="OSIS Logo"></div>` : ''}<h1>${firstTime ? copy.headingFirst : copy.headingResend}</h1><p>${copy.greeting},</p><p>${firstTime ? copy.introFirst : copy.introResend}</p><p style="margin:20px 0"><a href="${verificationLink}" class="btn">${copy.btnText}</a></p><p style="font-size:13px;color:#666">${copy.fallbackText}</p><div class="link">${verificationLink}</div><p style="font-size:13px;margin-top:20px"><strong>${copy.securityTitle}</strong><br>${copy.securityTips.map(t => `• ${t}`).join('<br>')}</p><p style="margin-top:24px">${copy.signature}<br><strong>${copy.team}</strong></p><div class="footer">${copy.footer}<br>© ${new Date().getFullYear()} ${copy.copyright}</div></div></body></html>`;
    return { subject, text, html };
  }

  // Modern variant (default)
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${subject}</title>
<style>
  body { margin:0; padding:0; background:#f6f7fb; font-family:Arial,'Helvetica Neue',Helvetica,sans-serif; -webkit-font-smoothing:antialiased; }
  .wrapper { width:100%; background:linear-gradient(135deg,#fff7e6,#ffe9c2,#ffd9a1); padding:32px 0; }
  .container { max-width:560px; margin:0 auto; background:#ffffff; border-radius:20px; box-shadow:0 8px 24px rgba(0,0,0,0.08); overflow:hidden; }
  .header { background:linear-gradient(135deg,#ffb347,#ff8635); padding:32px 28px 40px; color:#fff; text-align:center; position:relative; }
  ${logoUrl ? `.logo { margin-bottom:12px } .logo img { max-width:96px; height:auto; display:block; margin:0 auto; }` : ''}
  .brand { font-size:20px; font-weight:700; letter-spacing:.5px; margin:0 0 6px; }
  .tagline { font-size:12px; opacity:.9; margin:0; font-weight:500; }
  .circle { position:absolute; width:160px; height:160px; border-radius:50%; background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.35),rgba(255,255,255,0)); top:-40px; right:-40px; filter:blur(2px); }
  .content { padding:32px 34px 10px; color:#444; line-height:1.55; font-size:14px; }
  h1 { font-size:22px; margin:0 0 18px; color:#ff7a1f; letter-spacing:.3px; }
  .intro { font-size:15px; margin:0 0 18px; font-weight:500; color:#222; }
  .box { background:#fff6eb; border:1px solid #ffd9a1; padding:16px 18px; border-radius:14px; margin:0 0 22px; }
  .verify-btn { display:inline-block; background:linear-gradient(135deg,#ff9d3c,#ff7a1f); color:#fff !important; text-decoration:none; padding:14px 28px; border-radius:14px; font-size:15px; font-weight:600; letter-spacing:.3px; box-shadow:0 4px 12px rgba(255,140,60,0.35); }
  .verify-btn:hover { background:linear-gradient(135deg,#ff7a1f,#ff9d3c); }
  .divider { height:1px; background:#eee; margin:34px 0 26px; }
  .meta { font-size:12px; color:#666; line-height:1.6; }
  .link-fallback { word-break:break-all; font-size:12px; background:#fafafa; padding:10px 12px; border:1px solid #eee; border-radius:10px; }
  .footer { padding:0 34px 42px; text-align:center; }
  .footnote { font-size:11px; color:#999; line-height:1.5; max-width:420px; margin:0 auto 12px; }
  .signature { margin-top:18px; font-size:12px; color:#555; }
  @media (prefers-color-scheme: dark) {
    body { background:#1e1f22; }
    .wrapper { background:linear-gradient(135deg,#2d2e30,#3b3c3f); }
    .container { background:#242526; }
    .header { background:linear-gradient(135deg,#ff9d3c,#ff7a1f); }
    .content { color:#ddd; }
    h1 { color:#ffc489; }
    .box { background:#3a2f22; border-color:#5b4633; }
    .meta { color:#aaa; }
    .link-fallback { background:#2e2f31; border-color:#3a3b3d; color:#c7c7c7; }
    .footnote { color:#777; }
    .signature { color:#bbb; }
  }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="circle"></div>
        ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="OSIS Logo" width="96" height="96" style="max-width:96px;height:auto;display:block;margin:0 auto;" /></div>` : ''}
        <p class="brand">OSIS SMK Informatika FI</p>
        <p class="tagline">${lang === 'en' ? 'Internal Management Platform' : 'Platform Manajemen Internal'}</p>
      </div>
      <div class="content">
        <h1>${firstTime ? copy.headingFirst : copy.headingResend}</h1>
        <p class="intro">${copy.greeting}, ${firstTime ? copy.introFirst.toLowerCase() : copy.introResend.toLowerCase()}</p>
        <div class="box">
          <p style="margin:0 0 14px">${copy.instruction}</p>
          <p style="text-align:center;margin:0 0 4px"><a href="${verificationLink}" target="_blank" class="verify-btn">${copy.btnText}</a></p>
        </div>
        <p class="meta" style="margin:0 0 18px">${copy.fallbackText}</p>
        <p class="link-fallback">${verificationLink}</p>
        <div class="divider"></div>
        <p class="meta">${copy.securityTitle}<br/>${copy.securityTips.map(t => `• ${t}`).join('<br/>')}</p>
        <p class="signature">${copy.signature} <br/><strong>${copy.team}</strong></p>
      </div>
      <div class="footer">
        <p class="footnote">${copy.footer}</p>
        <p class="footnote">© ${new Date().getFullYear()} ${copy.copyright}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function buildResetEmail(params: ResetEmailParams) {
  const { resetLink, name, lang = 'id', variant = 'modern', logoUrl } = params;
  const displayName = name && name.trim().length > 0 ? name.trim() : (lang === 'en' ? 'OSIS Member' : 'Sahabat OSIS');
  
  const copy = lang === 'en' ? {
    subject: 'Reset Your OSIS Account Password',
    greeting: `Hello ${displayName}`,
    intro: 'We received a password reset request for your OSIS account.',
    instruction: 'Click the button below to set a new password (valid for 60 minutes):',
    btnText: 'Reset Password',
    fallbackText: 'If the button doesn\'t work, copy this link to your browser:',
    securityTitle: 'Security tips:',
    securityTips: ['Don\'t share this link with anyone.', 'Link will expire automatically after 60 minutes.', 'If you didn\'t request this, ignore this email.'],
    signature: 'Warm regards,',
    team: 'OSIS SMK Informatika FI Team',
    footer: 'This email is sent automatically by OSIS internal system. Please do not reply directly.',
    copyright: 'OSIS SMK Informatika Fithrah Insani',
    heading: 'Reset Your Password'
  } : {
    subject: 'Reset Password Akun OSIS Anda',
    greeting: `Halo ${displayName}`,
    intro: 'Kami menerima permintaan untuk mengatur ulang kata sandi akun OSIS Anda.',
    instruction: 'Klik tombol di bawah ini untuk mengatur kata sandi baru (berlaku 60 menit):',
    btnText: 'Reset Password',
    fallbackText: 'Jika tombol tidak bekerja, salin tautan berikut ke browser Anda:',
    securityTitle: 'Tips keamanan:',
    securityTips: ['Jangan bagikan tautan ini ke siapapun.', 'Tautan akan kadaluarsa otomatis setelah 60 menit.', 'Jika Anda tidak meminta ini, abaikan email ini.'],
    signature: 'Hangat,',
    team: 'Tim OSIS SMK Informatika Fithrah Insani',
    footer: 'Email ini dikirim otomatis oleh sistem internal OSIS. Mohon tidak membalas langsung pesan ini.',
    copyright: 'OSIS SMK Informatika Fithrah Insani',
    heading: 'Reset Password Anda'
  };
  
  const subject = copy.subject;
  const text = `${copy.greeting},\n\n${copy.intro}\n${copy.instruction}\n${resetLink}\n\n${copy.securityTitle}\n${copy.securityTips.map(t => `• ${t}`).join('\n')}\n\n${copy.signature}\n${copy.team}`;

  if (variant === 'minimal') {
    const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title><style>body{margin:0;padding:20px;font-family:Arial,sans-serif;background:#fafafa;color:#333;line-height:1.6}.container{max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e0e0e0;border-radius:8px}.logo{text-align:center;margin-bottom:24px}.logo img{max-width:120px;height:auto}h1{font-size:20px;margin:0 0 16px;color:#222}.btn{display:inline-block;background:#ff7a1f;color:#fff!important;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;margin:16px 0}.link{word-break:break-all;font-size:13px;color:#666;background:#f5f5f5;padding:10px;border-radius:4px;margin:12px 0}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:12px;color:#999;text-align:center}@media (prefers-color-scheme:dark){body{background:#1a1a1a;color:#ddd}.container{background:#2a2a2a;border-color:#444}h1{color:#fff}.link{background:#333;color:#ccc}.footer{border-color:#444;color:#888}}</style></head><body><div class="container">${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="OSIS Logo"></div>` : ''}<h1>${copy.heading}</h1><p>${copy.greeting},</p><p>${copy.intro}</p><p style="margin:20px 0"><a href="${resetLink}" class="btn">${copy.btnText}</a></p><p style="font-size:13px;color:#666">${copy.fallbackText}</p><div class="link">${resetLink}</div><p style="font-size:13px;margin-top:20px"><strong>${copy.securityTitle}</strong><br>${copy.securityTips.map(t => `• ${t}`).join('<br>')}</p><p style="margin-top:24px">${copy.signature}<br><strong>${copy.team}</strong></p><div class="footer">${copy.footer}<br>© ${new Date().getFullYear()} ${copy.copyright}</div></div></body></html>`;
    return { subject, text, html };
  }

  // Modern variant (default)
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${subject}</title>
<style>
  body { margin:0; padding:0; background:#f6f7fb; font-family:Arial,'Helvetica Neue',Helvetica,sans-serif; -webkit-font-smoothing:antialiased; }
  .wrapper { width:100%; background:linear-gradient(135deg,#fff7e6,#ffe9c2,#ffd9a1); padding:32px 0; }
  .container { max-width:560px; margin:0 auto; background:#ffffff; border-radius:20px; box-shadow:0 8px 24px rgba(0,0,0,0.08); overflow:hidden; }
  .header { background:linear-gradient(135deg,#ffb347,#ff8635); padding:32px 28px 40px; color:#fff; text-align:center; position:relative; }
  ${logoUrl ? `.logo { margin-bottom:12px } .logo img { max-width:96px; height:auto; display:block; margin:0 auto; }` : ''}
  .brand { font-size:20px; font-weight:700; letter-spacing:.5px; margin:0 0 6px; }
  .tagline { font-size:12px; opacity:.9; margin:0; font-weight:500; }
  .circle { position:absolute; width:160px; height:160px; border-radius:50%; background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.35),rgba(255,255,255,0)); top:-40px; right:-40px; filter:blur(2px); }
  .content { padding:32px 34px 10px; color:#444; line-height:1.55; font-size:14px; }
  h1 { font-size:22px; margin:0 0 18px; color:#ff7a1f; letter-spacing:.3px; }
  .intro { font-size:15px; margin:0 0 18px; font-weight:500; color:#222; }
  .box { background:#fff6eb; border:1px solid #ffd9a1; padding:16px 18px; border-radius:14px; margin:0 0 22px; }
  .reset-btn { display:inline-block; background:linear-gradient(135deg,#ff9d3c,#ff7a1f); color:#fff !important; text-decoration:none; padding:14px 28px; border-radius:14px; font-size:15px; font-weight:600; letter-spacing:.3px; box-shadow:0 4px 12px rgba(255,140,60,0.35); }
  .reset-btn:hover { background:linear-gradient(135deg,#ff7a1f,#ff9d3c); }
  .divider { height:1px; background:#eee; margin:34px 0 26px; }
  .meta { font-size:12px; color:#666; line-height:1.6; }
  .link-fallback { word-break:break-all; font-size:12px; background:#fafafa; padding:10px 12px; border:1px solid #eee; border-radius:10px; }
  .footer { padding:0 34px 42px; text-align:center; }
  .footnote { font-size:11px; color:#999; line-height:1.5; max-width:420px; margin:0 auto 12px; }
  .signature { margin-top:18px; font-size:12px; color:#555; }
  @media (prefers-color-scheme: dark) {
    body { background:#1e1f22; }
    .wrapper { background:linear-gradient(135deg,#2d2e30,#3b3c3f); }
    .container { background:#242526; }
    .header { background:linear-gradient(135deg,#ff9d3c,#ff7a1f); }
    .content { color:#ddd; }
    h1 { color:#ffc489; }
    .box { background:#3a2f22; border-color:#5b4633; }
    .meta { color:#aaa; }
    .link-fallback { background:#2e2f31; border-color:#3a3b3d; color:#c7c7c7; }
    .footnote { color:#777; }
    .signature { color:#bbb; }
  }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="circle"></div>
        ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="OSIS Logo" width="96" height="96" style="max-width:96px;height:auto;display:block;margin:0 auto;" /></div>` : ''}
        <p class="brand">OSIS SMK Informatika FI</p>
        <p class="tagline">${lang === 'en' ? 'Internal Management Platform' : 'Platform Manajemen Internal'}</p>
      </div>
      <div class="content">
        <h1>${copy.heading}</h1>
        <p class="intro">${copy.greeting}, ${copy.intro.toLowerCase()}</p>
        <div class="box">
          <p style="margin:0 0 14px">${copy.instruction}</p>
          <p style="text-align:center;margin:0 0 4px"><a href="${resetLink}" target="_blank" class="reset-btn">${copy.btnText}</a></p>
        </div>
        <p class="meta" style="margin:0 0 18px">${copy.fallbackText}</p>
        <p class="link-fallback">${resetLink}</p>
        <div class="divider"></div>
        <p class="meta">${copy.securityTitle}<br/>${copy.securityTips.map(t => `• ${t}`).join('<br/>')}</p>
        <p class="signature">${copy.signature} <br/><strong>${copy.team}</strong></p>
      </div>
      <div class="footer">
        <p class="footnote">${copy.footer}</p>
        <p class="footnote">© ${new Date().getFullYear()} ${copy.copyright}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

