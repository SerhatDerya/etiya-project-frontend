import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-products',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {

  @Input() accountId!: string;

  selectedProduct: any = null;
  showOfferSelection: boolean = false;
  showConfiguration: boolean = false;
  showSubmitOrder: boolean = false;
  activeTab: 'catalog' | 'campaign' = 'catalog';
  selectedOffer: any = null;
  basket: any[] = [];
  
  // Configuration için
  productForms: { [key: string]: FormGroup } = {};
  selectedConfigAddress: string = '';
  
  // Submit Order için
  orderId: string = '';
  
  // Mock adresler (gerçek uygulamada customer-info'dan alınmalı)
  mockAddresses = [
    { id: 'ADDR-001', title: 'Home', cityName: 'Istanbul', street: 'Main Street', houseNumber: '42', description: 'Primary Address', isDefault: true },
    { id: 'ADDR-002', title: 'Office', cityName: 'Ankara', street: 'Business Ave', houseNumber: '15/3', description: 'Work Address', isDefault: false },
    { id: 'ADDR-003', title: 'Summer House', cityName: 'Izmir', street: 'Beach Road', houseNumber: '7', description: 'Vacation Home', isDefault: false }
  ];

  currentConfigAddressPage = 1;
  configAddressesPerPage = 2;

  mockProducts = [
    { id: 'PRD-001', name: 'Premium Internet', campaignName: 'Summer Deal', campaignId: 'CMP-101' },
    { id: 'PRD-002', name: 'HD TV Package', campaignName: 'New Customer', campaignId: 'CMP-102' },
    { id: 'PRD-003', name: 'Mobile Plan', campaignName: 'Family Bundle', campaignId: 'CMP-103' }
  ];

  mockCatalogOffers = [
    { id: 'OFF-001', name: '100 Mbps Internet', price: 99.99 },
    { id: 'OFF-002', name: 'Premium TV Package', price: 149.99 },
    { id: 'OFF-003', name: 'Unlimited Mobile', price: 79.99 }
  ];

  mockCampaignOffers = [
    { id: 'OFF-004', name: 'Student Discount Internet', campaignId: 'CMP-201', price: 69.99 },
    { id: 'OFF-005', name: 'Family Bundle TV', campaignId: 'CMP-202', price: 199.99 },
    { id: 'OFF-006', name: 'Corporate Mobile Plan', campaignId: 'CMP-203', price: 299.99 }
  ];

  // Mock karakteristikler
  mockCharacteristics: { [key: string]: string[] } = {
    'OFF-001': ['Speed (Mbps)', 'Data Limit (GB)', 'Contract Period (Months)'],
    'OFF-002': ['Channel Count', 'HD Quality', 'Recording Hours'],
    'OFF-003': ['Data (GB)', 'Minutes', 'SMS Count'],
    'OFF-004': ['Speed (Mbps)', 'Student ID', 'Contract Period (Months)'],
    'OFF-005': ['Channel Count', 'Number of Devices', 'Recording Hours'],
    'OFF-006': ['Data (GB)', 'Minutes', 'Number of Lines']
  };

  constructor(private fb: FormBuilder) {}

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
  }

  onStartNewSale(event: Event): void {
    event.stopPropagation();
    this.showOfferSelection = true;
    console.log('Start New Sale clicked');
  }

  closeOfferSelection(): void {
    this.showOfferSelection = false;
    this.selectedOffer = null;
    this.basket = [];
    this.activeTab = 'catalog';
  }

  selectOffer(offer: any): void {
    this.selectedOffer = offer;
  }

  addToBasket(): void {
    if (this.selectedOffer && !this.basket.find(item => item.id === this.selectedOffer.id)) {
      this.basket.push({...this.selectedOffer});
      this.selectedOffer = null;
    }
  }

  clearBasket(): void {
    this.basket = [];
  }

  proceedToConfiguration(): void {
    if (this.basket.length > 0) {
      this.showOfferSelection = false;
      this.showConfiguration = true;
      
      // Her ürün için form oluştur
      this.basket.forEach(product => {
        const characteristics = this.mockCharacteristics[product.id] || [];
        const formGroup: any = {};
        
        characteristics.forEach(char => {
          formGroup[char] = ['', Validators.required];
        });
        
        this.productForms[product.id] = this.fb.group(formGroup);
      });
      
      // İlk adresi default olarak seç
      this.selectedConfigAddress = this.mockAddresses.find(a => a.isDefault)?.id || '';
    }
  }

  closeConfiguration(): void {
    this.showConfiguration = false;
    this.productForms = {};
    this.selectedConfigAddress = '';
    this.basket = [];
    this.currentConfigAddressPage = 1;
  }

  goBackToOfferSelection(): void {
    this.showConfiguration = false;
    this.showOfferSelection = true;
    this.productForms = {};
    this.selectedConfigAddress = '';
    this.currentConfigAddressPage = 1;
  }

  isConfigurationComplete(): boolean {
    if (!this.selectedConfigAddress) return false;
    
    for (const productId of Object.keys(this.productForms)) {
      if (!this.productForms[productId].valid) {
        return false;
      }
    }
    return true;
  }

  proceedToSubmitOrder(): void {
    if (this.isConfigurationComplete()) {
      this.showConfiguration = false;
      this.showSubmitOrder = true;
      
      // Generate order ID
      this.orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
  }

  goBackToConfiguration(): void {
    this.showSubmitOrder = false;
    this.showConfiguration = true;
  }

  closeSubmitOrder(): void {
    this.showSubmitOrder = false;
    this.productForms = {};
    this.selectedConfigAddress = '';
    this.basket = [];
    this.orderId = '';
    this.currentConfigAddressPage = 1;
  }

  submitOrder(): void {
    console.log('Order submitted:', {
      orderId: this.orderId,
      items: this.basket,
      address: this.getSelectedAddress(),
      totalAmount: this.getTotalAmount(),
      configurations: this.productForms
    });
    
    // Burada backend'e istek atılacak
    // Şimdilik sadece console'a yazıyoruz
    
    this.closeSubmitOrder();
  }

  getProductCharacteristics(productId: string): string[] {
    return this.mockCharacteristics[productId] || [];
  }

  selectConfigAddress(addressId: string): void {
    this.selectedConfigAddress = addressId;
  }

  getSelectedAddress(): any {
    return this.mockAddresses.find(a => a.id === this.selectedConfigAddress);
  }

  getTotalAmount(): number {
    return this.basket.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  // Adres sayfalama metodları
  getDisplayedConfigAddresses(): any[] {
    const startIndex = (this.currentConfigAddressPage - 1) * this.configAddressesPerPage;
    const endIndex = startIndex + this.configAddressesPerPage;
    return this.mockAddresses.slice(startIndex, endIndex);
  }

  nextConfigAddressPage(): void {
    const totalPages = Math.ceil(this.mockAddresses.length / this.configAddressesPerPage);
    if (this.currentConfigAddressPage < totalPages) {
      this.currentConfigAddressPage++;
    }
  }

  prevConfigAddressPage(): void {
    if (this.currentConfigAddressPage > 1) {
      this.currentConfigAddressPage--;
    }
  }

  get totalConfigAddressPages(): number {
    return Math.ceil(this.mockAddresses.length / this.configAddressesPerPage);
  }

  shouldShowNextConfigArrow(): boolean {
    return this.mockAddresses.length > this.configAddressesPerPage && 
           this.currentConfigAddressPage < this.totalConfigAddressPages;
  }

  shouldShowPrevConfigArrow(): boolean {
    return this.mockAddresses.length > this.configAddressesPerPage && 
           this.currentConfigAddressPage > 1;
  }

  onTransfer(event: Event): void {
    event.stopPropagation();
    console.log('Transfer clicked');
  }

  onServiceAddressChange(event: Event): void {
    event.stopPropagation();
    console.log('Service Address Change clicked');
  }

}