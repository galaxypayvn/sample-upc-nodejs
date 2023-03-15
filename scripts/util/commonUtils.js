const { v4: uuidv4 } = require("uuid");

function convertUtc2VnTimeZone(dateTime) {
    dateTime.setHours(dateTime.getHours() + 7);
    return dateTime;
}

function convertDateTimeToUtc(dateTime) {
    return new Date(
        dateTime.getUTCFullYear(),
        dateTime.getUTCMonth(),
        dateTime.getUTCDate(),
        dateTime.getUTCHours(),
        dateTime.getUTCMinutes(),
        dateTime.getUTCSeconds()
    );
}

function genYYYYMMDDHHmmss() {
    let now = convertDateTimeToUtc(new Date()); // gen datetime UTC
    now = convertUtc2VnTimeZone(now); // then convert to +7

    let year = "" + now.getFullYear();
    let month = "" + (now.getMonth() + 1);
    if (month.length == 1) {
        month = "0" + month;
    }
    let day = "" + now.getDate();
    if (day.length == 1) {
        day = "0" + day;
    }
    let hour = "" + now.getHours();
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    let minute = "" + now.getMinutes();
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    let second = "" + now.getSeconds();
    if (second.length == 1) {
        second = "0" + second;
    }
    return `${year}${month}${day}${hour}${minute}${second}`;
}

function uniqueId() {
    return uuidv4().toString().replace(/-/g, "");
}

module.exports = {
    genYYYYMMDDHHmmss,
    convertDateTimeToUtc,
    convertUtc2VnTimeZone,

    uniqueId,
}
