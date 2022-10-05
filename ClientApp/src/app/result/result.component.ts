import {Component, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CurrencyPipe} from '@angular/common';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-fetch-data',
  templateUrl: './result.component.html'
})
export class ResultComponent {
  constructor(
    public http: HttpClient,
    @Inject('BASE_URL')
    public baseUrl: string,
    // public baseApi: string = "localhost:9001",
    private router: Router,
    private route: ActivatedRoute,
    private currencyPipe: CurrencyPipe) {
  }

  transactionID: string;
  responseCode: string;
  orderNumber: string;
  orderAmount: string;
  orderDateTime: string;
  orderCurrency: string;

  resultResponseTime: string;
  rawContent: string;
  responseContent: string;

  ipnResponseTime: string;
  ipnRawContent: string;
  ipnResponseContent: string;

  public loading: boolean = false;
  public isDisabledButton: boolean = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.transactionID = decodeURIComponent(params['transactionID']);
      if(this.transactionID || this.transactionID != "")
      {
        this.queryTransaction();
      }
    });
  }

  public refresh() {
    this.loading = true;
    this.isDisabledButton = true;

    this.queryTransaction();
  }

  queryTransaction() {
    this.http
      .post<ResponseData>(this.baseUrl + 'api/transaction', {transactionID: this.transactionID})
      .subscribe(result => {

        if (result.rawContent) {
          this.rawContent = JSON.parse(result.rawContent);
          this.responseContent = JSON.parse(result.responseContent);
        }

        this.resultResponseTime = result.resultResponseTime;
        this.responseCode = result.responseContent;
        this.orderNumber = result.orderNumber;
        this.orderCurrency = result.orderCurrency;
        this.orderDateTime = result.orderDateTime;

        if (result.orderAmount) {
          if (result.orderCurrency == "VND") {
            this.orderAmount = this.currencyPipe.transform(result.orderAmount, 'VND', false).replace("VND", "") + " VND";
          } else {
            this.orderAmount = this.currencyPipe.transform(result.orderAmount, 'USD', false).replace("USD", "") + " USD";
          }
        }

        if (result.ipnRawContent) {
          this.ipnResponseTime = result.ipnResponseTime;
          this.ipnRawContent = JSON.parse(result.ipnRawContent);
          this.ipnResponseContent = JSON.parse(result.ipnResponseContent);
        }

        this.loading = false;
        this.isDisabledButton = false;
      }, error => {
        this.loading = false;
        this.isDisabledButton = false;
        console.error(error);
      });
  }
}

interface ResponseData {
  orderNumber: string;
  orderAmount: string;
  orderCurrency: string;
  orderDateTime: string;
  rawContent: string;
  resultResponseTime: string;
  responseContent: string;
  responseCode: string;
  ipnResponseTime: string;
  ipnRawContent: string;
  ipnResponseContent: string;
}
