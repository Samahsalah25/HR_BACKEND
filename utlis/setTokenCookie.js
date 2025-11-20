const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production'; // يفرق بين لوكال وبرودكشن

  res.cookie('token', token, {
    httpOnly: true,                 // ماينفعش الجافاسكريبت يوصلله → أمان
    secure: isProduction,           // true على برودكشن (HTTPS) عشان الموبايل يقبل الكوكي
    sameSite: isProduction ? 'none' : 'lax', // cross-domain لازم 'none' على برودكشن
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 يوم
  });
};
