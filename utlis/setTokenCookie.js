const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true, // خليها true
    secure: "none",   // على local لازم false
    sameSite: 'lax', // على local كفاية
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};



module.exports = setTokenCookie;
