const { createHash } = require("crypto");


const sha256SignString = (rawString, privateKey) => {
    return sha256(rawString, privateKey);
};

const sha256 = (text, privateKey = "") => {
    const hash = createHash("sha256");
    hash.update(text + privateKey, "utf8"); // add hash utf8
    return hash.digest("hex");
};


module.exports = {
    sha256,
    sha256SignString,
};
