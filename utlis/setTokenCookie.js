// const setTokenCookie = (res, token) => {
//   const isProduction = process.env.NODE_ENV === 'production';

//   res.cookie('token', token, {
//   httpOnly: true,
//   secure: false, // لازم false هنا
//   sameSite: 'lax', // مهم جدًا
//   maxAge: 15 * 60 * 1000,
// });

// };


// module.exports = setTokenCookie;
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";

  // res.cookie("token", token, {
  //   httpOnly: true,
  //   secure: isProduction,              // Production = true / Local = false
  //   sameSite: is8Production ? "none" : "lax",
  //   maxAge: 15 * 60 * 1000,
  // });
  
  res.cookie("token", token, {
    httpOnly: true,
    secure: false,              // Production = true / Local = false
    sameSite:"lax",
    maxAge: 1000*60*60*24*7,
  });
   

};

module.exports = setTokenCookie;
