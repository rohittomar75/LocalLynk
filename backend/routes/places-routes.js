const express = require("express");
const { check } = require("express-validator")

const router = express.Router();

const placesControllers = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

// /api/places/:pid
router.get("/:pid", placesControllers.getPlaceById);

// /api/places/user/:uid
router.get("/user/:uid", placesControllers.getPlacesByUserId);

// middleware which checks if request has a valid token
router.use(checkAuth);

// /api/places -> post request
router.post(
    "/",
    fileUpload.single("image"),
    [
        check("title").not().isEmpty(),
        check("description").isLength({min: 5}),
        check("address").not().isEmpty(),
    ],
    placesControllers.createPlace
);

// /api/places/:pid -> patch request
router.patch(
    "/:pid",
    [
        check("title").not().isEmpty(),
        check("description").isLength({min: 5})
    ],
    placesControllers.updatePlace
);

// /api/places/:pid -> delete request
router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;