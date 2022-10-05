import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './cancel.component.html',
})
export class CancelComponent {
  constructor(private route: ActivatedRoute, private router: Router) { }

  param1: string;
  param2: string;
  transaction

  ngOnInit() {
    this.transaction = history.state;
    console.log(this.transaction);
    //
    // this.route.queryParams.subscribe(params => {
    //   this.param1 = decodeURIComponent(params['param1']);
    //   this.param2 = decodeURIComponent(params['param2']);
    // });

    this.param1 = JSON.parse(history.state.ResponseData);
    this.param2 = JSON.parse(history.state.DecryptData);

    console.log(history.state.id);
  }
}
