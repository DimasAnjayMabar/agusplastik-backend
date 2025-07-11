class ResponseError extends Error {
    constructor(status, message, cause = null) {
        super(message);
        this.name = 'ResponseError';
        this.status = status;
        if (cause) {
            this.cause = cause;
            this.stack += '\nCaused by: ' + cause.stack;
        }
    }
}

export{
    ResponseError
}