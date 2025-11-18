import { Component, computed, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../../../../services/catalog-service';
import { Catalog } from '../../../../models/catalogsListResponse';
import { ProductOffer } from '../../../../models/productOffersListResponse';
import { Campaign } from '../../../../models/campaignsListResponse';
import { ProductByIdResponse } from '../../../../models/productByIdResponse';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-products',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {

  @Input() accountId!: string;
  @Input() customerAddresses: any[] = [];

  selectedProduct: any = null;
  showOfferSelection: boolean = false;
  showConfiguration: boolean = false;
  showSubmitOrder: boolean = false;
  activeTab: 'catalog' | 'campaign' = 'catalog';
  selectedOffer: any = null;
  basket: any[] = [];

  // Catalog state - Signals ile
  catalogs = signal<Catalog[]>([]);
  selectedCatalogId = signal<string>('');
  lastLoadedCatalogId = signal<string>('');
  loadingCatalogs = signal<boolean>(false);

  // Campaign state - Signals ile
  campaigns = signal<Campaign[]>([]);
  selectedCampaignId = signal<string>('');
  lastLoadedCampaignId = signal<string>('');
  loadingCampaigns = signal<boolean>(false);
  
  // Product Offers state - Signals ile
  productOffers = signal<ProductOffer[]>([]);
  allProductOffers = signal<ProductOffer[]>([]);
  loadingProductOffers = signal<boolean>(false);

  // Product prices cache
  productPrices: { [key: string]: ProductByIdResponse } = {};
  loadingPrices = signal<boolean>(false);

  // Search filters - Signals ile
  searchOfferId = signal<string>('');
  searchOfferName = signal<string>('');

  // Campaign search filters
  searchCampaignOfferId = signal<string>('');
  searchCampaignOfferName = signal<string>('');
  
  // Computed signals
  hasSearchCriteria = computed(() => 
    this.searchOfferId().trim() !== '' || this.searchOfferName().trim() !== ''
  );
  
  hasCampaignSearchCriteria = computed(() => 
    this.searchCampaignOfferId().trim() !== '' || this.searchCampaignOfferName().trim() !== ''
  );
  
  shouldShowResults = computed(() => 
    !this.loadingProductOffers() && this.selectedCatalogId() !== ''
  );
  
  shouldShowCampaignResults = computed(() => 
    !this.loadingProductOffers() && this.selectedCampaignId() !== ''
  );

  // Configuration için
  productForms: { [key: string]: FormGroup } = {};
  selectedConfigAddress: string = '';
  
  // Submit Order için
  orderId: string = '';

  currentConfigAddressPage = 1;
  configAddressesPerPage = 2;

  mockProducts = [
    { id: 'PRD-001', name: 'Premium Internet', campaignName: 'Summer Deal', campaignId: 'CMP-101' },
    { id: 'PRD-002', name: 'HD TV Package', campaignName: 'New Customer', campaignId: 'CMP-102' },
    { id: 'PRD-003', name: 'Mobile Plan', campaignName: 'Family Bundle', campaignId: 'CMP-103' }
  ];

  mockCampaignOffers = [
    { id: 'OFF-004', name: 'Student Discount Internet', campaignId: 'CMP-201', price: 69.99 },
    { id: 'OFF-005', name: 'Family Bundle TV', campaignId: 'CMP-202', price: 199.99 },
    { id: 'OFF-006', name: 'Corporate Mobile Plan', campaignId: 'CMP-203', price: 299.99 }
  ];

  mockCharacteristics: { [key: string]: string[] } = {
    'OFF-001': ['Speed (Mbps)', 'Data Limit (GB)', 'Contract Period (Months)'],
    'OFF-002': ['Channel Count', 'HD Quality', 'Recording Hours'],
    'OFF-003': ['Data (GB)', 'Minutes', 'SMS Count'],
    'OFF-004': ['Speed (Mbps)', 'Student ID', 'Contract Period (Months)'],
    'OFF-005': ['Channel Count', 'Number of Devices', 'Recording Hours'],
    'OFF-006': ['Data (GB)', 'Minutes', 'Number of Lines']
  };

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadCampaigns();
  }

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

  loadCatalogs(): void {
    this.loadingCatalogs.set(true);
    this.catalogService.getCatalogs().subscribe({
      next: (response: any) => {
        this.catalogs.set(response);
        console.log('Catalogs loaded:', response);
        this.loadingCatalogs.set(false);
      },
      error: (error) => {
        console.error('Error loading catalogs:', error);
        this.loadingCatalogs.set(false);
        alert('Failed to load catalogs. Please try again.');
      }
    });
  }

  loadCampaigns(): void {
    this.loadingCampaigns.set(true);
    this.catalogService.getCampaigns().subscribe({
      next: (response: any) => {
        this.campaigns.set(response);
        console.log('Campaigns loaded:', response);
        this.loadingCampaigns.set(false);
      },
      error: (error) => {
        console.error('Error loading campaigns:', error);
        this.loadingCampaigns.set(false);
        alert('Failed to load campaigns. Please try again.');
      }
    });
  }

  onStartNewSale(event: Event): void {
    event.stopPropagation();
    this.showOfferSelection = true;
    if (this.catalogs().length === 0 && !this.loadingCatalogs()) {
      this.loadCatalogs();
    }
    if (this.campaigns().length === 0 && !this.loadingCampaigns()) {
      this.loadCampaigns();
    }
    console.log('Start New Sale clicked');
  }

  loadProductOffersByCatalog(catalogId: string): void {
    console.log('Loading product offers for catalog:', catalogId);
    this.loadingProductOffers.set(true);
    this.productOffers.set([]);
    this.allProductOffers.set([]);
    
    this.catalogService.getProductOffersByCatalog(catalogId).subscribe({
      next: (response: any) => {
        console.log('API Response received:', response);
        this.allProductOffers.set(response);
        this.lastLoadedCatalogId.set(catalogId);
        
        this.applySearchFilter();
        this.loadProductPrices(response);
        
        console.log('Setting loadingProductOffers to false');
        this.loadingProductOffers.set(false);
      },
      error: (error) => {
        console.error('Error loading product offers:', error);
        this.loadingProductOffers.set(false);
        this.lastLoadedCatalogId.set('');
        alert('Failed to load product offers. Please try again.');
      }
    });
  }

  loadProductOffersByCampaign(campaignId: string): void {
    console.log('Loading product offers for campaign:', campaignId);
    this.loadingProductOffers.set(true);
    this.productOffers.set([]);
    this.allProductOffers.set([]);
    
    this.catalogService.getProductOffersByCampaign(campaignId).subscribe({
      next: (response: any) => {
        console.log('API Response received:', response);
        this.allProductOffers.set(response);
        this.lastLoadedCampaignId.set(campaignId);
        
        this.applyCampaignSearchFilter();
        this.loadProductPrices(response);
        
        console.log('Setting loadingProductOffers to false');
        this.loadingProductOffers.set(false);
      },
      error: (error) => {
        console.error('Error loading product offers:', error);
        this.loadingProductOffers.set(false);
        this.lastLoadedCampaignId.set('');
        alert('Failed to load product offers. Please try again.');
      }
    });
  }

  loadProductPrices(offers: ProductOffer[]): void {
    if (offers.length === 0) return;

    this.loadingPrices.set(true);
    const uniqueProductIds = [...new Set(offers.map(offer => offer.productId))];
    
    // Her product ID için API çağrısı yap
    const priceRequests = uniqueProductIds.map(productId => 
      this.catalogService.getProductById(productId)
    );

    forkJoin(priceRequests).subscribe({
      next: (products: any[]) => {
        products.forEach(product => {
          this.productPrices[product.id] = product;
        });
        console.log('Product prices loaded:', this.productPrices);
        this.loadingPrices.set(false);
      },
      error: (error) => {
        console.error('Error loading product prices:', error);
        this.loadingPrices.set(false);
      }
    });
  }

  getProductPrice(productId: string): number {
    return this.productPrices[productId]?.price || 0;
  }

  applySearchFilter(): void {
    const searchId = this.searchOfferId().toLowerCase().trim();
    const searchName = this.searchOfferName().toLowerCase().trim();
    const allOffers = this.allProductOffers();

    if (!searchId && !searchName) {
      this.productOffers.set([...allOffers]);
      return;
    }

    const filtered = allOffers.filter(offer => {
      const matchesId = !searchId || offer.id.toLowerCase().includes(searchId);
      const matchesName = !searchName || offer.name.toLowerCase().includes(searchName);
      return matchesId && matchesName;
    });

    this.productOffers.set(filtered);
    console.log('Applied filter - Results:', filtered.length, 'of', allOffers.length);
  }

  applyCampaignSearchFilter(): void {
    const searchId = this.searchCampaignOfferId().toLowerCase().trim();
    const searchName = this.searchCampaignOfferName().toLowerCase().trim();
    const allOffers = this.allProductOffers();

    if (!searchId && !searchName) {
      this.productOffers.set([...allOffers]);
      return;
    }

    const filtered = allOffers.filter(offer => {
      const matchesId = !searchId || offer.id.toLowerCase().includes(searchId);
      const matchesName = !searchName || offer.name.toLowerCase().includes(searchName);
      return matchesId && matchesName;
    });

    this.productOffers.set(filtered);
    console.log('Applied campaign filter - Results:', filtered.length, 'of', allOffers.length);
  }

  searchProductOffers(): void {
    const catalogId = this.selectedCatalogId();
    
    if (!catalogId) {
      alert('Please select a catalog first');
      return;
    }

    console.log('Search clicked - Selected Catalog:', catalogId);
    console.log('Last Loaded Catalog:', this.lastLoadedCatalogId());

    if (this.lastLoadedCatalogId() !== catalogId || this.allProductOffers().length === 0) {
      console.log('Loading data from API...');
      this.loadProductOffersByCatalog(catalogId);
      return;
    }

    console.log('Filtering existing data...');
    this.applySearchFilter();
  }

  searchCampaignProductOffers(): void {
    const campaignId = this.selectedCampaignId();
    
    if (!campaignId) {
      alert('Please select a campaign first');
      return;
    }

    console.log('Search clicked - Selected Campaign:', campaignId);
    console.log('Last Loaded Campaign:', this.lastLoadedCampaignId());

    if (this.lastLoadedCampaignId() !== campaignId || this.allProductOffers().length === 0) {
      console.log('Loading data from API...');
      this.loadProductOffersByCampaign(campaignId);
      return;
    }

    console.log('Filtering existing data...');
    this.applyCampaignSearchFilter();
  }

  clearSearch(): void {
    this.searchOfferId.set('');
    this.searchOfferName.set('');
    if (this.allProductOffers().length > 0) {
      this.productOffers.set([...this.allProductOffers()]);
    }
  }

  clearCampaignSearch(): void {
    this.searchCampaignOfferId.set('');
    this.searchCampaignOfferName.set('');
    if (this.allProductOffers().length > 0) {
      this.productOffers.set([...this.allProductOffers()]);
    }
  }

  closeOfferSelection(): void {
    this.showOfferSelection = false;
    this.selectedOffer = null;
    this.basket = [];
    this.activeTab = 'catalog';
    this.selectedCatalogId.set('');
    this.lastLoadedCatalogId.set('');
    this.selectedCampaignId.set('');
    this.lastLoadedCampaignId.set('');
    this.productOffers.set([]);
    this.allProductOffers.set([]);
    this.searchOfferId.set('');
    this.searchOfferName.set('');
    this.searchCampaignOfferId.set('');
    this.searchCampaignOfferName.set('');
    this.loadingProductOffers.set(false);
  }

  onCatalogChange(newCatalogId: string): void {
    this.selectedCatalogId.set(newCatalogId);
    
    if (newCatalogId) {
      this.productOffers.set([]);
      this.allProductOffers.set([]);
      this.searchOfferId.set('');
      this.searchOfferName.set('');
      this.lastLoadedCatalogId.set('');
      this.loadingProductOffers.set(false);
    } else {
      this.productOffers.set([]);
      this.allProductOffers.set([]);
      this.lastLoadedCatalogId.set('');
      this.loadingProductOffers.set(false);
      this.searchOfferId.set('');
      this.searchOfferName.set('');
    }
  }

  onCampaignChange(newCampaignId: string): void {
    this.selectedCampaignId.set(newCampaignId);
    
    if (newCampaignId) {
      this.productOffers.set([]);
      this.allProductOffers.set([]);
      this.searchCampaignOfferId.set('');
      this.searchCampaignOfferName.set('');
      this.lastLoadedCampaignId.set('');
      this.loadingProductOffers.set(false);
    } else {
      this.productOffers.set([]);
      this.allProductOffers.set([]);
      this.lastLoadedCampaignId.set('');
      this.loadingProductOffers.set(false);
      this.searchCampaignOfferId.set('');
      this.searchCampaignOfferName.set('');
    }
  }

  selectOffer(offer: any): void {
    this.selectedOffer = offer;
  }

  addToBasket(): void {
    if (this.selectedOffer && !this.basket.find(item => item.id === this.selectedOffer.id)) {
      const price = this.getProductPrice(this.selectedOffer.productId);
      this.basket.push({
        ...this.selectedOffer,
        price: price
      });
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
      
      // İlk primary adresi veya ilk adresi default olarak seç
      this.selectedConfigAddress = this.customerAddresses.find(a => a.isDefault)?.id || 
                                    (this.customerAddresses.length > 0 ? this.customerAddresses[0].id : '');
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
    return this.customerAddresses.find(a => a.id === this.selectedConfigAddress);
  }

  getTotalAmount(): number {
    return this.basket.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  // Adres sayfalama metodları
  getDisplayedConfigAddresses(): any[] {
    const startIndex = (this.currentConfigAddressPage - 1) * this.configAddressesPerPage;
    const endIndex = startIndex + this.configAddressesPerPage;
    return this.customerAddresses.slice(startIndex, endIndex);
  }

  nextConfigAddressPage(): void {
    const totalPages = Math.ceil(this.customerAddresses.length / this.configAddressesPerPage);
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
    return Math.ceil(this.customerAddresses.length / this.configAddressesPerPage);
  }

  shouldShowNextConfigArrow(): boolean {
    return this.customerAddresses.length > this.configAddressesPerPage && 
           this.currentConfigAddressPage < this.totalConfigAddressPages;
  }

  shouldShowPrevConfigArrow(): boolean {
    return this.customerAddresses.length > this.configAddressesPerPage && 
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