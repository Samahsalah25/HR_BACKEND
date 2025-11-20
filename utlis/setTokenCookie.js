const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true, // يحمي الكوكي من الـ JS، خليها true
    secure: process.env.NODE_ENV === 'production', // true على Vercel (HTTPS)، false لو local
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // None على production، Lax على local
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};



module.exports = setTokenCookie;
