const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,              
    secure: true,                
    sameSite: "none",            
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};


module.exports = setTokenCookie;
