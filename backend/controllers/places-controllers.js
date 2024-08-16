const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const { default: mongoose } = require("mongoose");

// this runs for route -> /api/places/:pid
const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid; // {pid: "p1"}
    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError("something went wrong, couldn't find the place", 500);
        return next(error);
    }
    if (!place) {
        return next(new HttpError("Could not find a place for the given id", 404));
    }
    // getters: true -> mongoose will return a clean id (not _id object)
    res.json({place: place.toObject( {getters: true} )}); // {place} is equivalent to {place : place}
};

// this runs for route -> /api/places/user/:uid
const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid; // {uid: "u1"}
    // let places;
    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate("places");
    } catch(err) {
        const error = new HttpError("fetching places failed, please try again later", 500);
        return next(error);
    }

    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        // console.log("error");
        return next(new HttpError("Could not find places for the given user id", 404)); // next(error) -> for async, throw error -> for sync
    }
    res.json({places: userWithPlaces.places.map((place) => {
        return place.toObject({ getters: true });
    })});
}

// this runs for post request route -> /api/places/
const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs passed, please check your data", 422));
    }
    const { title, description, address, creator} = req.body; // extracting data from request body
    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }
    const createdPlace = new Place({
        title: title,
        description: description,
        address: address,
        location: coordinates,
        image: req.file.path,
        creator: creator
    });

    let user;
    try {
        user = await User.findById(creator);
    } catch (err) {
        const error = new HttpError("creating place failed, please try again", 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError("could not find user for provided id", 404);
        return next(error);
    }
    console.log(user);

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess, validateModifiedOnly: true }); // try adding this if user validation failed error -> validateModifiedOnly: true
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError("creating place failed, please try again", 500);
        return next(error);
    }
    
    res.status(201).json({place: createdPlace.toObject({ getters: true })});
};

// this runs for patch request route -> /api/places/:pid
const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs passed, please check your data", 422));
    }
    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError("something went wrong, could not update place", 500);
        return next(error);
    }

    if (place.creator.toString() !== req.userData.userId) {
        const error = new HttpError(
            "you are not allowed to edit this place",
            401
        );
        return next(error);
    }

    place.title = title;
    place.description = description;
    
    try {
        await place.save();
    } catch (err) {
        const error = new HttpError("something went wrong, could not update place", 500);
        return next(error);
    }

    res.status(200).json({place: place.toObject({ getters: true })});
};

// this runs for delete request route -> /api/places/:pid
const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate("creator");
    } catch(err) {
        const error = new HttpError("something went error, couldn't delete place oho", 500);
        return next(error);
    }
    
    if (!place) {
        const error = new HttpError("could not find place for this id", 404);
        return next(error);
    }

    if (place.creator.id !== req.userData.userId) {
        const error = new HttpError("you are not allowed to delete this place", 401);
        return next(error);
    }

    const imagePath = place.image;

    try {
        // await place.deleteOne();
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.deleteOne({ session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess});
        await sess.commitTransaction();
    } catch(err) {
        const error = new HttpError("something went error, couldn't delete place", 500);
        return next(error);
    }

    fs.unlink(imagePath, (err) => {
        console.log(err);
    });
    
    res.status(200).json({message: "place deleted successfully"});
};

/* 
exporting like this also works
    exports.getPlaceById = getPlaceById;
    exports.getPlaceByUserId = getPlaceByUserId
*/
module.exports = {
    getPlaceById, 
    getPlacesByUserId,
    createPlace,
    updatePlace,
    deletePlace
};