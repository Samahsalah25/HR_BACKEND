const setTokenCookie = (res, token) => {

 res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 15 * 60 * 1000,
        });
 
};
 


module.exports = setTokenCookie;
