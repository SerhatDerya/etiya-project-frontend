import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  constructor(private httpClient: HttpClient) {}

  getCatalogs() {
    const url = 'http://localhost:8091/catalogservice/api/catalogs/';
    const token = localStorage.getItem('token');
    console.log('Fetching catalogs from URL:', url);
    return this.httpClient.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  getProductOffersByCatalog(catalogId: string) {
    const url = `http://localhost:8091/catalogservice/api/product_offers/getByCatalogId/${catalogId}`;
    const token = localStorage.getItem('token');
    console.log(`Fetching product offers for catalog ${catalogId} from URL:`, url);
    return this.httpClient.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  getCampaigns() {
    const url = 'http://localhost:8091/catalogservice/api/campaigns/';
    const token = localStorage.getItem('token');
    console.log('Fetching campaigns from URL:', url);
    return this.httpClient.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  getProductOffersByCampaign(campaignId: string) {
    const url = `http://localhost:8091/catalogservice/api/product_offers/getByCampaignId/${campaignId}`;
    const token = localStorage.getItem('token');
    console.log(`Fetching product offers for campaign ${campaignId} from URL:`, url);
    return this.httpClient.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  getProductById(productId: string) {
    const url = `http://localhost:8091/catalogservice/api/products/${productId}`;
    const token = localStorage.getItem('token');
    console.log(`Fetching product with ID ${productId} from URL:`, url);
    return this.httpClient.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }
  
}
