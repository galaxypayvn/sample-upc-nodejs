const request = require("request");

const requestPromise = (
    options
) => new Promise((rs, rj) => {
    request(options, (error, response, body) => {
        try {
            const statusCode = response && response.statusCode;
            const headers = (response && response.headers) || {};
            return rs({ statusCode, error, response, body, headers });
        } catch (exception) {
            console.log(exception);
            return rj(exception)
        } finally {
            // Write centralize log

        }
    });
});

module.exports = {
    requestPromise
}