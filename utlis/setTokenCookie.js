const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,       // لازم يبقى httpOnly
    secure: process.env.NODE_ENV === 'production',  // false لو local، true لو production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // None لو production، Lax لو local
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};


module.exports = setTokenCookie;
