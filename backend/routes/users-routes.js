const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

// /api/users/
router.get("/", usersControllers.getUsers);

// /api/users/signup
router.post(
    "/signup",
    fileUpload.single("image"),
    [
        check("name").not().isEmpty(),
        check("email").normalizeEmail().isEmail(),
        check("password").isLength({min: 6})
    ],
    usersControllers.signup
);

// /api/users/login
router.post("/login", usersControllers.login);

module.exports = router;