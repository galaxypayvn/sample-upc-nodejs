require("dotenv").config();
const express = require('express')
const _ejs = require("ejs");
const path = require("path");
const app = express()

const session = require("express-session");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 600, checkperiod: 600 });
const { requestPromise } = require("./service/gatewayService")
const { APP_PORT, PLAYGROUND_URL, APP_PUBLIC_URL, MERCHANT_GW_URL } = require("./scripts/config/config")
const { genYYYYMMDDHHmmss, uniqueId } = require("./scripts/util/commonUtils")
const { sha256SignString } = require("./scripts/util/crypto")

const port = APP_PORT
const fetch = require("node-fetch");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'mySecret', resave: false, saveUninitialized: false }));

app.use(express.static(path.join(__dirname, "public")));

// view engine setup
app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");
app.engine("ejs", function (filename, payload, cb) {
    payload = payload || {};
    payload.APP_PUBLIC_URL = APP_PUBLIC_URL;
    _ejs.renderFile(filename, payload, {}, cb);
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
        orderDescription: "DEMO TRANSACTION",
        paymentMethod: "DOMESTIC",
        sourceType: "",
        language: "en",
        playgroundURL: PLAYGROUND_URL,
        successURL: `${APP_PUBLIC_URL}/api/result`,
        failureURL: `${APP_PUBLIC_URL}/api/result`,
        pendingURL: `${APP_PUBLIC_URL}/api/result`,
        cancelURL: `${APP_PUBLIC_URL}/api/cancel`,
        ipnURL: `https://ac7b-58-186-241-92.ap.ngrok.io/api/ipns`,
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

    const redirectPay = await fetch(`${MERCHANT_GW_URL}/Merchant/Pay`, {
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