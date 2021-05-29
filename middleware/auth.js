//Middleware code to access resticted routes.
const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req,res,next){
    //Get token from header
    const token = req.header('x-auth-token');

    //Verify if token exists
    if(!token){
        res.status(401).json({msg: 'No token, Authorization denied'});
    }

    //Verify the Token
    try{
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        req.user = decoded.user; //Pass the decoded user to the Route
        next();
    }catch(err){
        res.status(401).json({msg: 'Token is Invalid'});
    }

}