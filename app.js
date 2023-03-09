const express = require('express')
const _ejs = require("ejs");
const path = require("path");
const app = express()
const { createHash } = require("crypto");
const request = require("request");
const { Router } = require('express');
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");
const redis = require("redis");
const httpContext = require("express-http-context");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 600, checkperiod: 600 });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'mySecret', resave: false, saveUninitialized: false }));

const port = 8383
const fetch = require("node-fetch");

app.use(express.static(path.join(__dirname, "public")));

// view engine setup
app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");
app.engine("ejs", function (filename, payload, cb) {
    payload = payload || {};
    _ejs.renderFile(filename, payload, {}, cb);
});

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

function convertUtc2VnTimeZone(dateTime) {
    dateTime.setHours(dateTime.getHours() + 7);
    return dateTime;
}

function uniqueId() {
    return uuidv4().toString().replace(/-/g, "");
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



const sha256 = (text, privateKey = "") => {
    const hash = createHash("sha256");
    hash.update(text + privateKey, "utf8"); // add hash utf8
    return hash.digest("hex");
};

const sha256SignString = (rawString, privateKey) => {
    return sha256(rawString, privateKey);
};

const connectClient = async (databaseIndex) => {
    const port = "6379" || 6379;
    const host = "master.redis-uat-upc-2022-06-06.bopuaq.apse1.cache.amazonaws.com" || "localhost";
    const auth = "WLKspMXeo5i6GqrWt" || "";
    const tls = "true" ? "s" : "";
    const client = redis.createClient({
        url: `redis${tls}://:${auth}@${host}:${port}`,
        database: databaseIndex || 0,
    });

    client.on("error", (err) => console.log("Redis Client Error", err));
    await client.connect();

    return client;
};

let transactionCacheService;
// set data to session cache
async function setCache(transactionID, data = {}) {
    // session[orderId] = data  {};
    transactionCacheService =
        transactionCacheService || (await connectClient(20));

    // Only status CREATED set expire 35 minutes, rest of them just keep expire
    const ttl =
        data.status && data.status.includes("STARTED_NORMAL") ? null : 2100;
    await setValue(transactionCacheService, transactionID, data, ttl);

    // set requestID
    setContextRequestID(data.order);

    // set traceParent
    setContextTraceParent(data.order);
}

// get data from session cache
async function getCache(transactionID) {
    transactionCacheService =
        transactionCacheService || (await connectClient(20));
    // let sessionData = session[transactionID] || {}; // set temp empty default prevent exception

    let sessionData =
        (await getValue(transactionCacheService, transactionID)) || {};
    // set requestID
    setContextRequestID(sessionData.order);

    // set traceParent
    setContextTraceParent(sessionData.order);
    return sessionData;
}

function setContextRequestID(sessionData) {
    // Set requestID
    const requestID =
        sessionData && sessionData.hasOwnProperty("requestID")
            ? sessionData.requestID
            : null;

    if (requestID) {
        httpContext.set("requestID", requestID);
    }

    return requestID;
}

function setContextTraceParent(sessionData) {
    // Set traceParent
    const traceParent =
        sessionData && sessionData.hasOwnProperty("traceParent")
            ? sessionData.traceParent
            : null;

    if (traceParent) {
        httpContext.set("traceParent", traceParent);
    }
    return traceParent;
}

const getValue = async (client, key) => {
    if (!client) {
        return null;
    }

    const json = await client.get(key);
    return JSON.parse(json);
};

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

async function CreateMerchantPay({
    data,
    apiKey,
    signature
}) {
    const options = {
        url: "https://dev-secure.galaxypay.vn/pay",
        method: "POST",
        headers: {
            APIKey: apiKey,
            Signature: signature,
            "content-type": "application/json; charset=utf-8"
        },
        json: data
    };

    return requestPromise(options);
}

app.get("/healthz", (req, res) => {
    return res.status(200).send('ok ne');
});

app.get('/', (req, res) => {
    const data =
    {
        orderID: "9144c96d599548ae88bdfd77f49b22cf",
        orderNumber: "20221103113341",
        orderAmount: 10000,
        orderCurrency: "VND",
        orderDateTime: "20220426083322",
        orderDescription: "DEMO TRANSACTION",
        paymentMethod: "DOMESTIC",
        sourceType: "",
        otp: "on",
        request: "purchase",
        language: "vi",
        successURL: "http://localhost:8383/api/result",
        failureURL: "http://localhost:8383/api/result",
        pendingURL: "http://localhost:8383/api/result",
        cancelURL: "http://localhost:8383/api/cancel",
        ipnURL: "https://43f9-58-186-241-92.ap.ngrok.io/api/ipn",
        extraData: {
            customer: {
                firstName: "Jacob",
                lastName: "Savannah",
                identityNumber: "6313126925",
                email: "Jacob@gmail.com",
                phoneNumber: "0580821083",
                phoneType: "CjcFqIPAtc",
                gender: "F",
                dateOfBirth: "19920117",
                title: "Mr"
            },
            device: {
                browser: "uL3ydX2Pcv",
                fingerprint: "ZdiijSPr0M",
                hostName: "JBddmayji5",
                ipAddress: "KU9CoAMTub",
                deviceID: "woB325my3h",
                deviceModel: "nPEDP9SyHc"
            },
            application: {
                applicationID: "V2hLZeYRHs",
                applicationChannel: "Mobile"
            },
            airline: {
                recordLocator: "VDknTdszRc",
                journeyType: 279182634,
                departureAirport: "Dm5W8daux6",
                departureDateTime: "26/04/202206:31:22",
                arrivalAirport: "DTMKu99Ucx",
                arrivalDateTime: "26/04/202215:18:30",
                services: [
                    {
                        serviceCode: "iOrEyae8km",
                        quantity: 687449710,
                        amount: 80000,
                        tax: 0,
                        fee: 10000,
                        totalAmount: 80000,
                        currency: "USD"
                    },
                    {
                        serviceCode: "YltyBWqm00",
                        quantity: 391314729,
                        amount: 60000,
                        tax: 0,
                        fee: 10000,
                        totalAmount: 100000,
                        currency: "USD"
                    }
                ],
                flights: [
                    {
                        airlineCode: "qHRJ0vSJbk",
                        carrierCode: "lVPkqwaoDr",
                        flightNumber: 304498347,
                        travelClass: "OET2hayLmS",
                        departureAirport: "J5OF0jDZ0A",
                        departureDate: "BBg2Vv5RrS",
                        departureTime: "26/04/202213:48:33",
                        departureTax: "n2ILRrqiS8",
                        arrivalAirport: "u3laQZXoff",
                        arrivalDate: "VR0hUprpMp",
                        arrivalTime: "26/04/202203:33:43",
                        fees: 10000,
                        taxes: 0,
                        fares: 50000,
                        fareBasisCode: "DwzXajRwiv",
                        originCountry: "A4uyesF2er"
                    }
                ],
                passengers: [
                    {
                        passengerID: "uew9dL5JAI",
                        passengerType: "SouBmUpryn",
                        firstName: "Muhammad",
                        lastName: "Kinsley",
                        title: "Mrs",
                        gender: "F",
                        dateOfBirth: "20220425",
                        identityNumber: "2KoxDO9XYv",
                        nameInPNR: "jGFPV12jcA",
                        memberTicket: "fwmplDrraT"
                    }
                ]
            },
            billing: {
                countryCode: "vn",
                stateProvine: "Hồ Chí Minh",
                cityName: "Nhà Bè",
                postalCode: "",
                streetNumber: "673",
                addressLine1: "Đường Nguyễn Hữu Thọ",
                addressLine2: ""
            },
            shipping: {
                countryCode: "vn",
                stateProvine: "Hồ Chí Minh",
                cityName: "Nhà Bè",
                postalCode: "",
                streetNumber: "673",
                addressLine1: "Đường Nguyễn Hữu Thọ",
                addressLine2: ""
            }
        }
    }
    res.render('demo', { data });
})


app.post("/pay", async (req, res) => {
    const { orderNumber, orderAmount, orderCurrency, orderDescription, paymentMethod, sourceType, resultURL, cancelURL, ipnURL, language, extraData } = req.body;
    const data =
    {
        orderID: "9144c96d599548ae88bdfd77f49b22cf",
        orderNumber,
        orderAmount,
        orderCurrency,
        orderDateTime: genYYYYMMDDHHmmss(),
        orderDescription,
        paymentMethod,
        sourceType,
        language,
        successURL: resultURL,
        failureURL: resultURL,
        pendingURL: resultURL,
        cancelURL: cancelURL,
        ipnURL: ipnURL,
        extraData
    }

    const apiKey = "ICB7IjMyMzUiOiJWaWV0IEpldCIsImNyZWF0ZWQiOiIyMDIyMDgxNjEwNDU0MCJ9.8269013cb5af84a2db3a98b81c17ba4f7c975e494eaf9c8fce616f6f540359da";
    const requestID = uniqueId();
    const requestData = {
        requestID,
        requestDateTime: genYYYYMMDDHHmmss(),
        requestData: data,
    }
    const signature = sha256SignString(JSON.stringify(requestData), "GPAY");

    const redirectPay = await fetch("https://uat-secure.galaxypay.vn/pay", {
        method: "post",
        headers: {
            APIKey: apiKey,
            Signature: signature,
            "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(requestData),
    })

    const json = await redirectPay.json();
    return res.json({ json, apiKey, requestData, signature });

    // fetch("https://dev-secure.galaxypay.vn/pay", {
    //     method: "post",
    //     headers: {
    //         APIKey: apiKey,
    //         Signature: signature,
    //         "content-type": "application/json; charset=utf-8"
    //     },
    //     body: JSON.stringify(signaturedData),
    // }).then(function (response) {
    //     return response.json();
    // }).then(function (data) {
    //     console.log(data)
    //     // const { responseData } = data;
    //     return res.send(data);
    // }).catch(err => console.error(err))

    // const { body } = await CreateMerchantPay({
    //     data: signaturedData,
    //     apiKey,
    //     signature
    // });

    // console.log('create order response body:' + JSON.stringify(body))
    // const { responseData } = body || {};
    // req.session.context = responseData.endpoint;
    // return res.redirect("/pay");
})

app.get("/api/cancel", (req, res) => {
    const response = {}
    response.decodeData = req.query
    response.encodeData = Buffer.from(response.decodeData.data, 'base64').toString('utf-8')
    const value = JSON.parse(response.encodeData)
    myCache.set(`${value.responseData.transactionID}`, response, 600)

    return res.redirect(
        `/cancel?transactionID=${value.responseData.transactionID}`
    );
})

app.post("/api/cancel", (req, res) => {
    const response = {}
    response.decodeData = req.body
    response.encodeData = Buffer.from(response.decodeData.data, 'base64').toString('utf-8')
    const value = JSON.parse(response.encodeData)
    myCache.set(`${value.responseData.transactionID}`, response, 600)

    return res.redirect(
        `/cancel?transactionID=${value.responseData.transactionID}`
    );
})

app.get("/cancel", async (req, res) => {
    const { transactionID } = req.query;
    const dataCache = myCache.get(transactionID);
    res.render('cancel', { dataCache });
})

app.get("/api/result", async (req, res) => {
    const response = {}
    response.decodeData = req.query
    response.encodeData = Buffer.from(response.decodeData.data, 'base64').toString('utf-8')
    const value = JSON.parse(response.encodeData)
    myCache.mset([
        { key: `${value.responseData.transactionID}`, val: response, ttl: 600 },
    ])
    return res.redirect(
        `/result?transactionID=${value.responseData.transactionID}`
    );
})

app.post("/api/result", async (req, res) => {
    const response = {}
    response.decodeData = req.body
    response.encodeData = Buffer.from(response.decodeData.data, 'base64').toString('utf-8')
    const value = JSON.parse(response.encodeData)
    myCache.mset([
        { key: `${value.responseData.transactionID}`, val: response, ttl: 600 },
    ])
    return res.redirect(
        `/result?transactionID=${value.responseData.transactionID}`
    );
})

app.get("/result", async (req, res) => {
    const { transactionID } = req.query;
    const responseIPN = myCache.get(`${transactionID} + a`);
    const response = myCache.get(transactionID);

    res.render('result', { dataCache: { responseIPN, response } });
})

app.get("/api/ipn", async (req, res) => {
    const responseIPN = {}
    responseIPN.decodeData = req.query;
    responseIPN.encodeData = Buffer.from(responseIPN.decodeData.data, 'base64').toString('utf-8')
    const value = JSON.parse(responseIPN.encodeData)
    myCache.mset([
        { key: `${value.responseData.transactionID}`, val: response, ttl: 600 },
    ])
    return console.log(responseIPN)
})

app.post("/api/ipn", async (req, res) => {
    const responseIPN = {}
    responseIPN.decodeData = req.body;
    responseIPN.encodeData = Buffer.from(responseIPN.decodeData.data, 'base64').toString('utf-8')
    const value = JSON.parse(responseIPN.encodeData)
    myCache.mset([
        { key: `${value.responseData.transactionID} + a`, val: responseIPN, ttl: 600 },
    ])
    return console.log(responseIPN)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})