const setTokenCookie = (res, token) => {
res.cookie('token', token, {
  httpOnly: true,  // شيلتيها مؤقتًا
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000
});

};
module.exports = setTokenCookie;
