export class UPC {
  constructor() {};

  // Integration Methods
  public integrationMethods = {
    Simple: { value: "SIMPLE", text: "Merchant Checkout", isDefault: true, order: 1 },
    Hosted: { value: "HOSTED", text: "Merchant Hosted Checkout", isDefault: false, order: 2 },
    Option: { value: "OPTION", text: "Pay with Options", isDefault: false, order: 3 },
  }

  public paymentMethods = {
    ATM:            { value: "atm", text: "ATM CARD (VIETNAM)", isDefault: true, order: 1 },
    International:  { value: "international", text: "INTERNATIONAL CARD (VISA, MASTER CARD, JCB,...)", isDefault: false, order: 2 },
    Wallet:         { value: "wallet", text: "eWALLET", isDefault: false, order: 3 },
    Hub:            { value: "hub", text: "PAYMENT HUBS", isDefault: false, order: 4 },
  }

  public paymentProviders = {
    atm: [
      { value: "", text: "VIETNAM LOCAL BANKS", isDefault: true, order: 1 },
      { value: "970400", text: "SAIGON BANK/NGÂN HÀNG TMCP SÀI GÒN CÔNG THƯƠNG", isDefault: false, order: 2 },
    ],
    international: [
      { value: "VISA", text: "VISA CARD", isDefault: true, order: 1 },
      { value: "MASTER", text: "MASTER CARD", isDefault: false, order: 2 },
    ],
    wallet: [
      { value: "GPAY", text: "GPAY eWALLET", isDefault: true, order: 1 },
      { value: "MOMO", text: "MOMO eWALLET", isDefault: false, order: 2 },
    ],
    hub: [
      { value: "2C2P", text: "2C2P HUB", isDefault: true, order: 1 },
    ]
  }

  // currencyOption ATM and MOMO
  public currencyDomestic = [
    {
      value: "VND",
      text: "VND",
    }
  ]

  // currencyOption MPGS
  public currencyMPGs = [
    {
      value: "VND",
      text: "VND",
    },
    {
      value: "USD",
      text: "USD",
    }
  ]

  // currencyOption 2C2P
  public currency2C2P = [
    {
      value: "VND",
      text: "VND",
    },
    {
      value: "USD",
      text: "USD",
    },
    {
      value: "THB",
      text: "THB",
    },
    {
      value: "JPY",
      text: "JPY",
    },
    {
      value: "INR",
      text: "INR",
    },
    {
      value: "TWD",
      text: "TWD",
    },
    {
      value: "MYR",
      text: "MYR",
    },
    {
      value: "SGD",
      text: "SGD",
    },
    {
      value: "KRW",
      text: "KRW",
    },
    {
      value: "KHR",
      text: "KHR",
    },
    {
      value: "MMK",
      text: "MMK",
    },
    {
      value: "IDR",
      text: "IDR",
    },
    {
      value: "HKD",
      text: "HKD",
    },
    {
      value: "CNY",
      text: "CNY",
    }
  ]

  public paymentExtra = {
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
      services: [{
        serviceCode: "iOrEyae8km",
        quantity: 687449710,
        amount: 80000,
        tax: 0,
        fee: 10000,
        totalAmount: 80000,
        currency: "USD"
      }, {
        serviceCode: "YltyBWqm00",
        quantity: 391314729,
        amount: 60000,
        tax: 0,
        fee: 10000,
        totalAmount: 100000,
        currency: "USD"
      }
      ],
      flights: [{
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
      passengers: [{
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
