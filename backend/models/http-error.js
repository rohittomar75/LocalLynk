class HttpError extends Error {
    constructor(message, errorCode) {
        super(message);    // initializing message property
        this.code = errorCode // initializing code property
    }
}

module.exports = HttpError;