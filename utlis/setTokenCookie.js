const setTokenCookie = (res, token) => {
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,       // false على localhost
    sameSite: 'lax',     // Lax كفاية للـ local
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};


module.exports = setTokenCookie;
