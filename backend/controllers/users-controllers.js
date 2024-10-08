const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");
const { CancellationToken } = require("mongodb");


// this runs for route -> /api/users/
const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, "-password");
    } catch (err) {
        const error = new HttpError("fetching users failed, please try again later", 500);
        return next(error);
    }
    res.json({users: users.map((user) => {
        return user.toObject({ getters: true });
    })});
};


// this runs for route -> /api/users/signup
const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs passed, please check your data", 422));
    }
    const { name, email, password } = req.body;
    let existingUser;
    try {
        existingUser = await User.findOne({email: email});
    } catch (err) {
        const error = new HttpError("signing up failed, please try again later", 500);
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError("user exists already, please login instead", 422);
        return next(error);
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12); // hashes password with 12 salting rounds
    } catch (err) {
        const error = new HttpError("could not create user, please try again", 500);
        return next(error);
    }

    const createdUser = new User({
        name: name,
        email: email,
        image: req.file.path,
        password: hashedPassword,
        places: []
    });
    
    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError("signing user falied, please try again", 500);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            {userId: createdUser.id, email: createdUser.email},
            process.env.JWT_KEY,
            {
                expiresIn: "1h"
            }
        );
    } catch (err) {
        const error = new HttpError(
            "signing up failed, please try again later.",
            500
        );
        return next(error);
    }
    
    res.status(201).json({
        userId: createdUser.id,
        email: createdUser.email,
        token: token
    });
};

// this runs for rooute -> /api/users/login
const login = async (req, res, next) => {
    const {email, password} = req.body;
    let existingUser;
    try {
        existingUser = await User.findOne({email: email});
    } catch (err) {
        const error = new HttpError("Login failed, please try again later", 500);
        return next(error);
    }

    if (!existingUser) {
        const error = new HttpError("invalid credentials, could not log you in", 401);
        return next(error);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        const error = new HttpError(
            "could not log you in, please check your credentials and try again",
            500
        );
        return next(error);
    }
    
    if (!isValidPassword) {
        const error = new HttpError("invalid credentials, could not log you in", 403);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            {
                userId: existingUser.id,
                email: existingUser.email
            },
            process.env.JWT_KEY,
            {
                expiresIn: "1h"
            }
        );
    } catch (err) {
        const error = new HttpError("Login failed, please try again later", 500);
        return next(error);
    }

    res.status(200).json({
        userId: existingUser.id,
        email: existingUser.email,
        token: token
    });
};

module.exports = {
    getUsers,
    signup,
    login
};