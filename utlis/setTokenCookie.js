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
// const setTokenCookie = (res, token) => {
//   const isProduction = process.env.NODE_ENV === "production";

//     res.cookie("token", token, {
//     httpOnly: true,
//     secure: isProduction,        // Local = false / Production = true
//     sameSite: isProduction ? "none" : "lax",
//     // maxAge: 7 * 24 * 60 * 60 * 1000,
//        maxAge: 2 * 60 * 1000, 
//   });
   

// };
const setTokenCookie = (res, token, maxAgeMs = 7 * 24 * 60 * 60 * 1000) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: maxAgeMs,
  });
};
module.exports = setTokenCookie;


