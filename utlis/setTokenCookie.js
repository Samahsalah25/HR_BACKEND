const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,             // يحمي الكوكي من JS
    secure: isProduction,       // true في production, false في local
    sameSite: isProduction ? 'none' : 'lax', // none في production, lax في local
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
  });
};


module.exports = setTokenCookie;
