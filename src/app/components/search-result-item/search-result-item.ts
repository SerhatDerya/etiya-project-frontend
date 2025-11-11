import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-result-item',
  imports: [],
  templateUrl: './search-result-item.html',
  styleUrl: './search-result-item.scss',
})
export class SearchResultItem {
  @Input() id!: string;
  @Input() customerId!: string;
  @Input() firstName!: string;
  @Input() middleName!: string;
  @Input() lastName!: string;
  @Input() natId!: string;

  constructor(private router: Router) {}

  onCustomerInfo(customerId: string): void {
    localStorage.setItem('selectedCustomerNumber', this.customerId);
    localStorage.setItem('selectedCustomerId', this.id);
    this.router.navigateByUrl(`/b2c/customer-info/${customerId}`);
  }

}
