const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
    if (req.method === "OPTIONS") {
        return next();
    }
    // checking if we have a token and it is a valid one
    try {
        const token = req.headers.authorization.split(" ")[1]; // Authorization: "Bearer TOKEN"
        if (!token) {
            throw new Error("Authentication Failed");
        }
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        req.userData = {userId: decodedToken.userId};
        next();
    } catch (err) {
        const error = new HttpError("Authentication Failed", 403);
        return next(error);
    }
    
    

};