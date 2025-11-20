const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    // httpOnly: true,
    secure: true,          // دايمًا true لأن Vercel دايمًا HTTPS
    sameSite: 'none',      // دايمًا none علشان cross-origin (frontend + backend دومينات مختلفة)
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};


module.exports = setTokenCookie;
