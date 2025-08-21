// middleware/clientTime.js
const getClientTime = (req, res, next) => {

  const clientTime = req.headers['client-time'] || 
                    req.headers['x-client-time'] || 
                    req.headers['date'];
  
  if (clientTime) {
    req.clientTime = new Date(clientTime);
  } else {
    req.clientTime = new Date();
  }
  
 
  if (isNaN(req.clientTime.getTime())) {
    req.clientTime = new Date();
  }
  
  next();
};

module.exports = getClientTime;