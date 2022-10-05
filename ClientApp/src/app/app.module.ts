import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { CancelComponent } from './cancel/cancel.component';
import { PaymentComponent } from './home/payment.component';
import { RouterComponent } from './router/router.component';
import { ResultComponent } from './result/result.component';
import { CommonModule, CurrencyPipe } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    CancelComponent,
    PaymentComponent,
    RouterComponent,
    ResultComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: PaymentComponent, pathMatch: 'full' },
      { path: 'cancel', component: CancelComponent },
      { path: 'success', component: ResultComponent },
      { path: 'router', component: RouterComponent },
    ])
  ],
  providers: [CurrencyPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
