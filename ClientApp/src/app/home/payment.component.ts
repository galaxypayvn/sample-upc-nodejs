import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Component, Inject} from '@angular/core';
import {CurrencyPipe} from '@angular/common';
import {UPC} from './variables';

@Component({
  selector: 'app-payment-component',
  templateUrl: './payment.component.html'
})
export class PaymentComponent {

  public UPC: UPC;
  public defaultPaymentMethod: string;
  public paymentMethod: string;
  public paymentSource: string;
  public paymentSourceOptions: any;

  //configMerchant;
  public merchant = (<HTMLSelectElement>document.getElementById("txtlistMerchant")).value;
  public listAPIKey = JSON.parse(this.merchant);

  public lang = "vi";
  public orderNumber = Math.floor((Math.random() * 100000)).toString();
  public orderAmount = "10,000";
  public orderCurrency = "VND";
  public orderDescription = "Secure Page Demo";
  public extra: string;
  public currencyOption: any;
  public cardNumber = "9704000000000018";
  public cardHolderName = "Nguyen Van A";
  public cardIssueDate = "03/07";
  public cardVerificationValue = "100";
  public labelCardDate = "Card Issue Date";
  public integrationMethod = "SIMPLE";
  public APIKey = "";
  public SuccessURL: string;

  public resultData: ResponseData;
  public isPayWithOption = false;
  public isDisableHosted = true;
  public isCVV = true;
  public loading: boolean = false;
  public isDisabledButton: boolean = false;
  public apiUrl = "localhost:9001";
  

  constructor(public http: HttpClient,
              @Inject('BASE_URL')
              public baseUrl: string,
              private route: Router,
              private currencyPipe: CurrencyPipe)
  {
    // baseApi = "localhost:9000"
    this.UPC = new UPC();
    this.defaultPaymentMethod = this.UPC.paymentMethods.ATM.value;

    this.paymentMethod = this.defaultPaymentMethod;
    this.paymentSourceOptions = this.UPC.paymentProviders[this.paymentMethod];
    this.paymentSource = this.UPC.paymentProviders[this.paymentMethod][0].value;
    this.extra = JSON.stringify(this.UPC.paymentExtra, null, 4);
    this.SuccessURL = baseUrl + "api/result";

    this.currencyOption = this.UPC.currencyDomestic;
  }

  sortOptions = (a, b): number => { return a.value.order > b.value.order ? 1 : 0; }

  transformAmount() {
    let numb = this.orderAmount.match(/\d/g);
    this.orderAmount = numb.join("");

    if (this.orderCurrency == "USD") {
      this.orderAmount = this.currencyPipe.transform(this.orderAmount, "USD", false);
      this.orderAmount = this.orderAmount.replace("USD", "");
    } else {
      this.orderAmount = this.currencyPipe.transform(this.orderAmount, "VND", false);
      this.orderAmount = this.orderAmount.replace("VND", "");
    }
  }

  filterProvider(element: any) {
    const method = (<HTMLInputElement>document.getElementById("integrationMethods")).value;
    const Methods = this.UPC.integrationMethods;
    const provider = element.value;
    const Providers = this.UPC.paymentMethods;

    this.isDisableHosted = (
      provider === Providers.Wallet.value ||
      provider === Providers.Hub.value ||
      method !== Methods.Hosted.value
    );

    switch (provider) {
      case Providers.ATM.value:
        this.paymentSourceOptions = this.UPC.paymentProviders[provider];
        this.paymentSource = this.paymentSourceOptions[0].value;
        this.isCVV = true;
        this.currencyOption = this.UPC.currencyDomestic;
        break;

      case Providers.International.value:
        this.paymentSourceOptions = this.UPC.paymentProviders[provider];
        this.paymentSource = this.paymentSourceOptions[0].value;
        this.isCVV = !(this.isDisableHosted === false);
        this.currencyOption = this.UPC.currencyMPGs;
        break;

      case Providers.Wallet.value:
        this.paymentSourceOptions = this.UPC.paymentProviders[provider];
        this.paymentSource = this.paymentSourceOptions[0].value;
        this.currencyOption = this.UPC.currencyDomestic;
        break;

      case Providers.Hub.value:
        this.paymentSourceOptions = this.UPC.paymentProviders[provider];
        this.paymentSource = this.paymentSourceOptions[0].value;
        this.currencyOption = this.UPC.currency2C2P;
        break;
    }

    this.setCardInfo();
  }

  filterMethod(element: any) {
    let method = element.value;
    let Methods = this.UPC.integrationMethods;
    let Providers = this.UPC.paymentMethods;

    switch (method) {
      // HOSTED
      case Methods.Hosted.value:
        const paymentMethod = (<HTMLInputElement>document.getElementById("paymentMethods")).value;
        this.isDisableHosted = (paymentMethod === Providers.Wallet.value || paymentMethod === Providers.Hub.value);
        this.isCVV = !(this.isDisableHosted == false && paymentMethod === Providers.International.value);
        this.isPayWithOption = false;
        break;

      // OPTION
      case Methods.Option.value:
        this.isDisableHosted = true;
        this.isPayWithOption = true;
        break;

      default:
        this.isDisableHosted = true;
        this.isPayWithOption = false;
        break;
    }

    this.setCardInfo();
  }

  filterPaymentSource() {
    this.setCardInfo();
  }

  setCardInfo() {
    if (this.isCVV === false)
    {
      const source = this.paymentSource;
      if (source === "VISA")
      {
        this.labelCardDate = "Card Expire Date";
        this.cardNumber = "4508750015741019";
        this.cardHolderName = "Nguyen Van A"
        this.cardIssueDate = "01/39";
      }
      else
      {
        this.labelCardDate = "Card Expire Date";
        this.cardNumber = "5123450000000008";
        this.cardHolderName = "Nguyen Van A"
        this.cardIssueDate = "01/39";
      }
    }
    else
    {
      // NAPAS
      this.labelCardDate = "Card Issue Date/Expire Date";
      this.cardNumber = "9704000000000018";
      this.cardHolderName = "Nguyen Van A"
      this.cardIssueDate = "03/07";
    }
  }

  public inProcess() {
    this.loading = true;
    this.isDisabledButton = true;

    // Selected Merchant
    let merchant = {
      apiKey: null,
      salt:   null
    };

    let elementMerchant = (<HTMLSelectElement>document.getElementById("merchant"));
    if (elementMerchant != null)
    {
      this.APIKey = elementMerchant.value;
      merchant = this.listAPIKey.find(item => item.value == this.APIKey);
    }

    let requestData = {
      language: this.lang,
      billNumber: this.orderNumber,
      orderAmount: this.orderAmount,
      orderCurrency: this.orderCurrency,
      orderDescription: this.orderDescription,
      cardType: this.paymentMethod,
      bank: this.paymentSource,
      otp: "on",
      request: "purchase",
      extraData: this.extra,
      cardNumber: this.cardNumber,
      cardHolderName: this.cardHolderName,
      cardIssueDate: this.cardIssueDate,
      cardExpireDate: this.cardIssueDate,
      cardVerificationValue: this.cardVerificationValue,
      integrationMethod: this.integrationMethod,
      apiKey: merchant.apiKey,
      salt: merchant.salt,
      successURL: this.SuccessURL
    };

    this.http.post<ResponseData>(this.baseUrl + 'api/client', requestData)
      .subscribe(
        result => {
          this.resultData = result;

          if (result.responseCode != "200") {
            alert(result.responseMessage);
          }
          // success
          else if (result.responseCode == "200" && result.responseData.endpoint != null) {
            window.location.href = result.responseData.endpoint;
          }

          this.loading = false;
          this.isDisabledButton = false;
        },
        result => {
          console.error(result);
          this.loading = false;
          this.isDisabledButton = false;

          const messages = [];
          for (const property in result.error.errors) {
            messages.push(result.error.errors[property])
          }

          alert(result.statusText + ": " + messages);
        });
  }

  public inCancel() {
    this.route.navigate(['/cancel']);
  }
}

interface ResponseData {
  responseCode: string;
  responseData: OrderData;
  responseMessage: string;
}

interface OrderData {
  transactionId: string;
  endpoint: string;
}
