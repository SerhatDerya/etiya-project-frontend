import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-products',
  imports: [],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {

  @Input() accountId!: string;

  selectedProduct: any = null;

  mockProducts = [
    { id: 'PRD-001', name: 'Premium Internet', campaignName: 'Summer Deal', campaignId: 'CMP-101' },
    { id: 'PRD-002', name: 'HD TV Package', campaignName: 'New Customer', campaignId: 'CMP-102' },
    { id: 'PRD-003', name: 'Mobile Plan', campaignName: 'Family Bundle', campaignId: 'CMP-103' }
  ];

  onViewProduct(event: Event, product: any): void {
    event.stopPropagation();
    this.selectedProduct = product;
    console.log('View product:', product);
  }

  closeProductDetail(): void {
    this.selectedProduct = null;
  }

  onDeleteProduct(event: Event, product: any): void {
    event.stopPropagation();
    console.log('Delete product:', product);
    // Implement delete logic
  }

  onStartNewSale(event: Event): void {
    event.stopPropagation();
    console.log('Start New Sale clicked');
    // Implement logic
  }

  onTransfer(event: Event): void {
    event.stopPropagation();
    console.log('Transfer clicked');
    // Implement logic
  }

  onServiceAddressChange(event: Event): void {
    event.stopPropagation();
    console.log('Service Address Change clicked');
    // Implement logic
  }

}