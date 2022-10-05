const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const config = require("config");
const server = require("http").createServer(app);
const request = require('request');
const crypto = require('./services/crypto');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const GCache = {
  cache: {},
  isOnCache(id) {
    return this.cache.hasOwnProperty(id);
  },
  addToCache(id, json) {
    // if (this.isOnCache(id)) return;
    this.cache[id] = json;
  },
  getFromCache(id) {
    if (!this.isOnCache(id)) return;
    return this.cache[id];
  }
}

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

const requestPromise = (options, title = '', errorHandle = true) => new Promise((rs, rj) => {
  request(options, (error, response, body) => {
    const responseDateTime = new Date().toISOString();
    if (error) {
      if (!errorHandle) {
        rj(error)
        return;
      }
    }
    if (response && response.statusCode) console.log(`[${title}] [${responseDateTime}] Response status: ${response.statusCode}`)
    rs({ error, response, body })
  })
})

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/transaction', async function (req, res) {
  try {
    if (req.body) {
      const securePage = config.get("secure").endpoint;
      const {
        merchantKey,
        billNumber,
        orderAmount,
        orderCurrency,
        orderDescription,
        language,
        cardType,
        bank,
        otp,
        request,
        token,
        client_ip_addr
      } = req.body;
      const order_timestamp = Math.round(Date.now());
      const data = {
        billNumber,
        orderAmount,
        orderCurrency,
        orderDescription,
        language,
        cardType,
        bank,
        otp,
        request,
        token,
        client_ip_addr,
        order_timestamp
      }
      data.uphParameters = {
        "ip": '1.1.1.1',
        "agent": "Chrome 92.0",
        "device": "Windows",
      }
      data.signature = crypto.sha256SignObject(data);
      const { error, body } = await requestPromise({
        method: 'POST',
        url: `${securePage}/transaction`,
        headers: {
          Accept: 'application/json',
          ContentType: 'application/json',
          merchantKey: merchantKey
        },
        json: data
      }, 'InitTransaction')
      if (error) return res.json({ error });

      const s = crypto.sha256SignObject(body);
      if (body.signature && body.signature !== s) return res.json({ error: 'invalid signature' });
      res.json(body)
    }
  } catch (e) {
    res.send('error');
  }
});

app.post('/cancel', async (req, res) => {
  try {
    const plainTextData = crypto.aes256Decrypt(req.body.data);
    const data = JSON.parse(plainTextData);
    console.log(data)
    return res.redirect(`${config.get('GatewayUrl')}/cancel`)
  } catch (e) {
    res.send('error');
  }
});

app.post('/result', async (req, res) => {
  try {
    let plainTextData = '';
    if (req.body.data) {
      plainTextData = crypto.aes256Decrypt(req.body.data);
      const data = JSON.parse(plainTextData);
      if (data.responseCode == "00") {
        return res.redirect(`${config.get('GatewayUrl')}/result`)
      }
      return res.redirect(`${config.get('GatewayUrl')}/error`)
    }
  } catch (e) {
    return res.redirect(`${config.get('GatewayUrl')}/error`)
  }
});

app.post('/ipn', async (req, res) => {
  try {
    let plainTextData = '';
    if (req.body.data) {
      plainTextData = crypto.aes256Decrypt(req.body.data);
      const data = JSON.parse(plainTextData);
      if (data.responseCode == "00") {
        return res.json({ result: 'SUCCESS' });
      }
      return res.json({ result: 'FAILURE' });
    }
  } catch (e) {
    return res.json({ result: 'FAILURE' });
  }
});

//new

app.post('/api/client', async (requestData, res) => {
  try {
    var extraData = JSON.parse(requestData.body.extraData);
  }
  catch (e) {
    console.log(e);
    return res.json(
      {
        ResponseCode: "400",
        ResponseMessage: "Extra data is not json",
      });
  }
  requestData.body.orderAmount = requestData.body.orderAmount.replaceAll(",", "");
  const orderAmount = parseFloat(
    requestData.body.orderAmount)
  if (isNaN(orderAmount)) {
    return res.json(
      {
        ResponseCode: "400",
        ResponseMessage: "Order Amount is invalid.",
      })
  }

  try {
    const isHostedMerchant = requestData.body.integrationMethod == "HOSTED";
    const isPayWithOption = requestData.body.integrationMethod == "OPTION";
    const route = isPayWithOption ? "payWithOption" : "pay";
    const url = config.get("upc").endpoint + "/" + route;
    const apiKey = requestData.body.apiKey ?? config.get("upc").apiKey;

    let order = {};
    //
    order.orderID = uuidv4();
    order.orderNumber = requestData.body.billNumber;
    //
    order.orderDateTime = moment().format('yyyyMMDDHHmmss');
    order.orderAmount = orderAmount;
    order.orderCurrency = requestData.body.orderCurrency;
    order.orderDescription = requestData.body.orderDescription;
    order.extraData = extraData;
    order.language = requestData.body.language;
    order.successURL = requestData.body.successURL;
    order.otp = "on",
    order.request = "purchase"
    order.cardNumber = null,
    order.cardHolderName = null,
    order.cardIssueDate = null,
    order.cardExpireDate = null,
    order.cardVerificationValue = null

    // Simple Checkout & Hosted Checkout
    if (isPayWithOption == false) {
      order.cardType = requestData.body.cardType;
      order.bank = requestData.body.bank;
    }
    // Hosted Checkout
    if (isHostedMerchant &&
      requestData.cardType.ToUpper() != "WALLET" &&
      requestData.cardType.ToUpper() != "HUB") {
      order.cardNumber = requestData.body.cardNumber;
      order.cardHolderName = requestData.body.cardHolderName;
      order.cardIssueDate = requestData.body.cardIssueDate;
      order.cardExpireDate = requestData.body.cardExpireDate;
      order.cardVerificationValue = requestData.body.cardVerificationValue;
    }

    let request = {};
    request.requestID = uuidv4();
    request.requestDateTime = moment().format('yyyyMMDDHHmmss');
    request.requestData = order;

    let content = JSON.stringify(request);
    console.log("Request: " + content);
    const signature = crypto.sha256(content);
    console.log("Signature: " + signature);
    // let response = ServiceBase.Post(url, content, apiKey, signature);
    const { error, response } = await requestPromise({
      method: 'POST',
      url: url,
      headers: {
        Accept: 'application/json',
        ContentType: 'application/json',
        apiKey: apiKey,
        signature: signature
      },
      json: request
    }, 'InitTransaction')
    if (error) return res.json({ error });

    // Response
    console.log("Response: " + JSON.stringify(response));
    let resultData =
    {
      requestID: request.RequestID,
      responseDateTime: moment().format('yyyyMMDDHHmmss'),
      responseData: response.body.responseData,
      responseCode: "200",
      responseMessage: "Success"
    }

    res.json(resultData);

  } catch (e) {
    console.log(e);
    return res.json({
      ResponseCode: "500",
      ResponseMessage: "Sorry, The Server is busy. Please try again later.",
    });
  }
});

app.post('/api/cancel', async (req, res) => {
  try {
    let response = Buffer.from(req.body.data, 'base64').toString('ascii');
    console.log("Cancel URL Callback: " + response);

    let serviceResponse = JSON.parse(response);

    let order = serviceResponse?.ResponseData ?? {};
    if (!order.transactionID) {
      order.transactionID = uuidv4();
    }

    let content = JSON.stringify(req.body);
    let transaction = {};
    transaction.transactionID = order.transactionID;
    transaction.rawContent = content;
    transaction.responseContent = response;
    GCache.addToCache(transaction.transactionID, transaction);
    const url = `${config.get('ClientUrl')}/success?transactionID=` + order.transactionID;
    return res.redirect(url);
  } catch (e) {
    res.send('error');
  }
});

app.get('/api/cancel', async (req, res) => {
  try {
    let response = Buffer.from(req.query.data, 'base64').toString('ascii');
    console.log("Cancel URL Callback: " + response);

    let serviceResponse = JSON.parse(response);

    let order = serviceResponse?.ResponseData ?? {};
    if (!order.transactionID) {
      order.transactionID = uuidv4();
    }

    let content = JSON.stringify(req.query);
    let transaction = {};
    transaction.transactionID = order.transactionID;
    transaction.rawContent = content;
    transaction.responseContent = response;
    GCache.addToCache(transaction.transactionID, transaction);
    const url = `${config.get('ClientUrl')}/success?transactionID=` + order.transactionID;
    return res.redirect(url);
  } catch (e) {
    res.send('error');
  }
});

app.post('/api/result', async (req, res) => {
  try {
    let response = Buffer.from(req.body.data, 'base64').toString('utf8');
    console.log("Result URL Callback: " + response);

    let serviceResponse = JSON.parse(response);

    let order = serviceResponse?.responseData ?? {};
    if (!order.transactionID) {
      order.transactionID = uuidv4();
    }

    let content = JSON.stringify(req.body);
    let transaction = {};
    transaction.transactionID = order.transactionID;
    transaction.resultResponseTime = moment(serviceResponse?.ResponseDateTime).format("yyyyMMDDHHmmss");
    transaction.responseCode = serviceResponse?.responseCode;
    transaction.rawContent = content;
    transaction.responseContent = response;
    transaction.orderNumber = order.orderNumber;
    transaction.orderAmount = order.orderAmount.toString();
    transaction.orderCurrency = order.orderCurrency;
    transaction.orderDateTime = moment(order.OrderDateTime).format("yyyyMMDDHHmmss");
    GCache.addToCache(transaction.transactionID, transaction);

    const url = `${config.get('ClientUrl')}/success?transactionID=` + order.transactionID;
    return res.redirect(url);
  } catch (e) {
    res.send('error');
  }
});

app.get('/api/result', async (req, res) => {
  try {
    let response = Buffer.from(req.query.data, 'base64').toString('utf8');
    console.log("Result URL Callback: " + response);

    let serviceResponse = JSON.parse(response);


    let order = serviceResponse?.responseData ?? {};
    if (!order.transactionID) {
      order.transactionID = uuidv4();

    }

    let content = JSON.stringify(req.query);
    let transaction = {};
    transaction.transactionID = order.transactionID;
    transaction.resultResponseTime = moment(serviceResponse?.ResponseDateTime).format("yyyyMMDDHHmmss");
    transaction.responseCode = serviceResponse?.responseCode;
    transaction.rawContent = content;
    transaction.responseContent = response;
    transaction.orderNumber = order.orderNumber;
    transaction.orderAmount = order.orderAmount.toString();
    transaction.orderCurrency = order.orderCurrency;
    transaction.orderDateTime = moment(order.OrderDateTime).format("yyyyMMDDHHmmss");
    GCache.addToCache(transaction.transactionID, transaction);

    const url = `${config.get('ClientUrl')}/success?transactionID=` + order.transactionID;
    console.log(url);
    return res.redirect(url);
  } catch (e) {
    res.send('error:' + e);
  }
});


app.post('/api/ipn', async (req, res) => {
  try {
    let response = Buffer.from(req.body.data, 'base64').toString('utf8');
    console.log("IPN URL PostBack: " + response);

    let serviceResponse = JSON.parse(response);

    let order = serviceResponse?.responseData ?? {};
    if (order.transactionID === "" || order.transactionID === null) {
      order.transactionID = uuidv4();
    }

    let content = JSON.stringify(req.body);
    let transaction = {};
    transaction.transactionID = order.transactionID;
    transaction.iPNResponseTime = moment(serviceResponse?.responseDateTime).format("yyyyMMDDHHmmss");
    transaction.responseCode = serviceResponse?.RrsponseCode;
    transaction.iPNRawContent = content;
    transaction.iPNResponseContent = response;

    GCache.addToCache(transaction.transactionID, transaction);
  } catch (e) {
    res.send('error');
  }
});

app.post('/api/transaction', async function (req, res) {
  try {
    if (req.body) {
      console.log("Aa" + req.body);
      let transaction = req.body
      if (!transaction.transactionID) {
        return res.json({})
      }

      transaction = GCache.getFromCache(transaction.transactionID);
      if (!transaction) {
        return res.json({})
      }
      return res.json(transaction)
    }
  } catch (e) {
    return res.json({})
  }
});

app.get('/api/transaction', async function (req, res) {
  try {
    if (req.query) {
      let transaction = req.query
      if (!transaction.transactionID) {
        return res.json({})
      }

      transaction = GCache.getFromCache(transaction.transactionID);
      console.log(transaction);
      return res.json(transaction)

    }
  } catch (e) {
    return res.json({})
  }
});

server.listen(9001, function () {
  console.log("listening on *:9001");
});