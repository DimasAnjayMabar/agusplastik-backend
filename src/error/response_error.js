// class ResponseError extends Error {
//     constructor(status, message, cause = null) {
//         super(message);
//         this.name = 'ResponseError';
//         this.status = status;
//         if (cause) {
//             this.cause = cause;
//             this.stack += '\nCaused by: ' + cause.stack;
//         }
//     }
// }

class ResponseError extends Error {
    /**
     * Creates a comprehensive error object for API responses
     * @param {number} status - HTTP status code
     * @param {string} message - Human-readable error message
     * @param {object} [details] - Additional error details
     * @param {Error} [cause] - Original error that caused this error
     * @param {string} [code] - Application-specific error code
     * @param {string} [type] - Error type/category
     * @param {string} [documentation] - URL to documentation about this error
     * @param {object} [metadata] - Any additional metadata about the error
     */
    constructor(
        status,
        message,
        {
            cause = null,
            code = null,
            type = null,
            documentation = null,
            metadata = null,
            details = null,
        } = {}
    ) {
        super(message);
        this.name = 'ResponseError';
        this.status = status;
        this.timestamp = new Date().toISOString();
        
        // Optional properties
        if (cause) {
            this.cause = cause;
            this.stack += '\nCaused by: ' + cause.stack;
        }
        if (code) this.code = code;
        if (type) this.type = type;
        if (documentation) this.documentation = documentation;
        if (metadata) this.metadata = metadata;
        if (details) this.details = details;
    }

    /**
     * Returns a complete error description object
     * @returns {object} Detailed error information
     */
    toJSON() {
        return {
            error: {
                name: this.name,
                status: this.status,
                message: this.message,
                ...(this.code && { code: this.code }),
                ...(this.type && { type: this.type }),
                ...(this.details && { details: this.details }),
                timestamp: this.timestamp,
                ...(this.documentation && { documentation: this.documentation }),
                ...(this.metadata && { metadata: this.metadata }),
                ...(this.cause && { 
                    cause: {
                        name: this.cause.name,
                        message: this.cause.message,
                        ...(this.cause.stack && { stack: this.cause.stack })
                    }
                })
            }
        };
    }

    /**
     * Returns a string representation of the complete error
     * @returns {string} Formatted error string
     */
    toString() {
        let str = `${this.name} [${this.status}]: ${this.message}`;
        if (this.code) str += `\nCode: ${this.code}`;
        if (this.type) str += `\nType: ${this.type}`;
        if (this.details) str += `\nDetails: ${JSON.stringify(this.details)}`;
        if (this.cause) str += `\nCaused by: ${this.cause.toString()}`;
        if (this.documentation) str += `\nDocumentation: ${this.documentation}`;
        return str;
    }
}

export{
    ResponseError
}