const jwt = require('jsonwebtoken');

module.exports = function isHasToken(req, res, next) {
     try {
          const header = req.headers['authorization'];
          if (!header || !header.startsWith('Bearer ')) {
               return res.status(400).json({
                    message: "Authorization header is missing or invalid"
               });
          }

          const token = header.split(' ')[1];
          if (!token) {
               return res.status(400).json({
                    message: "Token is missing"
               });
          }

          jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
               if (err) {
                    return res.status(401).json({
                         message: "Invalid or expired token",
                         error: err
                    });
               }
               req.user = user;
               next();
          });
     } catch (error) {
          console.error("Error in isHasToken middleware:", error);
          return res.status(500).json({
               message: "Internal server error",
               error
          });
     }
};

/*
{
  "title": "Sample Product",
  "body": "This is a detailed description of the product.",
  "category": "Electronics",
  "price": 199.99,
  "rate": 4.5,
  "stock": 20,
  "size": "Medium",
  "dimensions": "15x10x5 cm",
  "warranty": "2 years",
  "materials": "Plastic, Metal"
}
*/
