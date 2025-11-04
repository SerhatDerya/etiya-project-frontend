import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-result-item',
  imports: [],
  templateUrl: './search-result-item.html',
  styleUrl: './search-result-item.scss',
})
export class SearchResultItem {
  @Input() customerId: string = "CUST-1001";
  @Input() firstName!: string;
  @Input() middleName!: string;
  @Input() lastName!: string;
  @Input() natId!: string;

  constructor(private router: Router) {}

  onCustomerInfo(customerId: string): void {
    this.router.navigateByUrl(`/b2c/customer-info/${customerId}`);
  }

}
