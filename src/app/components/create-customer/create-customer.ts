// create-customer.component.ts (GÜNCELLENMİŞ)

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerService, } from '../../services/customer-service'; 
import { CreateCustomerRequest } from '../../models/createCustomerRequest'; // CreateCustomerRequest'i import et
import { CreateCustomerResponse } from '../../models/createCustomerResponse'; // CreateCustomerResponse'i import et
import { CreateContactMediumsRequest } from '../../models/createContactMediumsRequest'; // CreateContactMediumsRequest'i import et
import { CreateAddressRequest } from '../../models/createAddressRequest'; // CreateAddressRequest'i import et
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

// Yeni eklenen şehir modelleri (Değişmedi)
export type CitiesListResponse = City[];

export interface City {
  id: string;
  name: string;
}

// GÜNCELLENMİŞ Adres modeli: cityName yerine cityId tutulacak
interface Address {
  id: number;
  title: string;
  cityName: string; // Görünümde kullanılacak isim
  cityId: string;   // API'a gönderilecek ID
  street: string;
  houseNumber: string;
  description: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-create-customer',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
  ],
  templateUrl: './create-customer.html',
  styleUrls: ['./create-customer.scss']
})
export class CreateCustomer implements OnInit {
  currentStep: number = 1; 
  customerForm!: FormGroup;

  // Yeni Şehir Listesi
  cityList: City[] = []; 

  // Adres Yönetimi
  addressList: Address[] = [];
  isAddingNewAddress: boolean = false; 
  newAddressForm!: FormGroup;

  // Düzenleme Yönetimi için yeni eklenenler
  isEditingAddress: boolean = false;
  editingAddressId: number | null = null;
  editAddressForm!: FormGroup; 
  
  // Sayfalama Yönetimi
  addressesPerPage: number = 2;
  currentAddressPage: number = 1;
  get totalAddressPages(): number {
    return Math.ceil(this.addressList.length / this.addressesPerPage);
  }

  constructor(private fb: FormBuilder, private router: Router, private customerService: CustomerService) {}

  ngOnInit(): void {
    // Şehir verilerini çekme işlemi (Değişmedi)
    this.customerService.getCities().subscribe({
      next: (response: CitiesListResponse) => {
        this.cityList = response;
      },
      error: (err) => {
        console.error('Şehirler çekilirken hata oluştu:', err);
        this.cityList = [
             { id: '34', name: 'İstanbul' },
             { id: '06', name: 'Ankara' },
             { id: '35', name: 'İzmir' },
        ];
      }
    });

    // Ana Müşteri Formu
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      motherName: [''],
      middleName: [''],
      // API request'e uyum sağlamak için: dateOfBirth alanı
      birthDate: ['', Validators.required], 
      fatherName: [''],
      nationalityId: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],

      // ... Contact Medium Group (Değişmedi)
      email: ['', [Validators.required, Validators.email]],
      mobilePhone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      homePhone: [''],
      fax: ['']
    });

    // Yeni Adres Formu: cityName yerine cityId kullanılıyor
    this.newAddressForm = this.fb.group({
      title: ['', Validators.required],
      cityId: ['', Validators.required], // DİKKAT: cityName yerine cityId kullanıldı
      street: ['', Validators.required],
      houseNumber: ['', Validators.required],
      description: ['', Validators.required],
      isDefault: [false]
    });

    // Düzenleme Adres Formu: cityName yerine cityId kullanılıyor
    this.editAddressForm = this.fb.group({
      title: ['', Validators.required],
      cityId: ['', Validators.required], // DİKKAT: cityName yerine cityId kullanıldı
      street: ['', Validators.required],
      houseNumber: ['', Validators.required],
      description: ['', Validators.required],
      isDefault: [false]
    });
  }
  
  // ... (nextStep, prevStep, onCancel, markControlsAsTouched fonksiyonları değişmedi) ...
  nextStep() {
    if (this.currentStep === 1) {
      const demographicInfoControls = ['firstName', 'lastName', 'gender', 'birthDate', 'nationalityId'];
      this.markControlsAsTouched(demographicInfoControls);
      
      const isStep1Valid = demographicInfoControls.every(c => this.customerForm.get(c)?.valid);
      
      if (isStep1Valid) {
        this.currentStep = 2;
        this.currentAddressPage = 1; 
      } else {
        console.error('Lütfen Demografik Bilgileri doğru giriniz.');
      }
    } else if (this.currentStep === 2) {
      // Yeni adres ekleme/düzenleme modunda değilsek ilerle
      if (!this.isAddingNewAddress && !this.isEditingAddress) {
        this.currentStep = 3;
      } else {
        console.error('Lütfen adresi kaydedin veya iptal edin.');
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onCancel() {
    this.router.navigateByUrl('/b2c');
  }

  private markControlsAsTouched(controls: string[]) {
    controls.forEach(controlName => {
      this.customerForm.get(controlName)?.markAsTouched();
    });
  }

  private formatDateForApi(dateString: string): string {
        if (!dateString) return '';
        // Input type="date" yyyy-MM-dd formatında döndürür.
        const [year, month, day] = dateString.split('-'); 
        return `${day}/${month}/${year}`; // DD/MM/YYYY formatına çevir
  }

  // YENİ/GÜNCELLENMİŞ createCustomer FONKSİYONU
  createCustomer() {
    const contactMediumControls = ['email', 'mobilePhone'];
    this.markControlsAsTouched(contactMediumControls);
    
    if (this.customerForm.valid) {
      // 1. CreateCustomerRequest Hazırlama

      const customerFormData = this.customerForm.value;
      
      const formattedBirthDate = this.formatDateForApi(customerFormData.birthDate);
      
      const createCustomerRequest: CreateCustomerRequest = {
                firstName: customerFormData.firstName,
                middleName: customerFormData.middleName,
                lastName: customerFormData.lastName,
                dateOfBirth: formattedBirthDate, // <-- Formatlanmış değeri kullan
                gender: customerFormData.gender,
                motherName: customerFormData.motherName,
                fatherName: customerFormData.fatherName,
                natId: customerFormData.nationalityId
            };

      console.log('1. Müşteri Oluşturma Başlatılıyor:', createCustomerRequest);

      // Müşteri Oluşturma -> Contact Medium Oluşturma -> Adresleri Oluşturma Zinciri
      this.customerService.createCustomer(createCustomerRequest).pipe(
        // 1. Müşteri Oluşturuldu, customerId alındı.
        switchMap((customerResponse: CreateCustomerResponse) => {
          const customerId = customerResponse.id;
          console.log(`2. Müşteri ID alındı: ${customerId}. İletişim Bilgileri Oluşturuluyor.`);
          
          // 2. CreateContactMediumsRequest Hazırlama
          const createContactMediumsRequest: CreateContactMediumsRequest = {
            email: customerFormData.email,
            homePhone: customerFormData.homePhone,
            mobilePhone: customerFormData.mobilePhone,
            fax: customerFormData.fax,
            customerId: customerId
          };

          const contactMediums$ = this.customerService.createContactMediums(createContactMediumsRequest);

          // 3. CreateAddressRequest'leri Hazırlama ve ForkJoin ile toplu gönderme
          const addressRequests$ = this.addressList.map(address => {
            const createAddressRequest: CreateAddressRequest = {
              title: address.title,
              street: address.street,
              houseNumber: address.houseNumber,
              description: address.description,
              isDefault: address.isDefault,
              customerId: customerId,
              cityId: address.cityId // API'a cityId gönderiliyor
            };
            return this.customerService.createAddress(createAddressRequest);
          });

          // Tüm Contact Medium ve Adres isteklerini paralel gönder ve hepsini bekle
          return forkJoin([contactMediums$, ...addressRequests$]).pipe(
            map(() => customerId) // Zincirin sonunda müşteri ID'sini döndür
          );
        }),
        catchError(error => {
          console.error('Müşteri oluşturma zincirinde hata oluştu:', error);
          alert('Hata: Müşteri, İletişim veya Adres oluşturulurken bir hata oluştu.');
          return of(null);
        })
      ).subscribe(customerId => {
        if (customerId) {
          console.log('3. İletişim Bilgileri ve Tüm Adresler başarıyla oluşturuldu.');
          alert(`Müşteri ${customerId} Başarıyla Oluşturuldu!`);
          this.router.navigateByUrl('/b2c'); // Başarı durumunda yönlendirme
        }
      });

    } else {
      console.error('Form geçersiz. Lütfen tüm alanları doldurun.');
      this.customerForm.markAllAsTouched();
    }
  }


  // --- Yeni Adres Ekleme İşlevleri (GÜNCELLENMİŞ) ---

  // ... (addNewAddress, cancelNewAddress fonksiyonları cityId'ye uygun güncellendi) ...

  addNewAddress() {
    this.isAddingNewAddress = true;
    this.isEditingAddress = false; 
    // cityId'yi boş string olarak resetle
    this.newAddressForm.reset({ cityId: '', isDefault: this.addressList.length === 0 }); 
    this.newAddressForm.markAsUntouched();
  }

  cancelNewAddress() {
    this.isAddingNewAddress = false;
    this.newAddressForm.reset();
  }

  saveNewAddress() {
    if (this.newAddressForm.valid) {
      let isDefault = this.newAddressForm.value.isDefault;

      if (this.addressList.length === 0) {
        isDefault = true;
      }

      console.log("Form cityId değeri:", this.newAddressForm.value.cityId);
      
      const selectedCity = this.cityList.find(c => c.id === this.newAddressForm.value.cityId);
      
      const newAddress: Address = {
        id: this.addressList.length > 0 ? Math.max(...this.addressList.map(a => a.id)) + 1 : 1,
        title: this.newAddressForm.value.title,
        cityName: selectedCity ? selectedCity.name : 'Bilinmeyen Şehir', // Görüntüleme için isim
        cityId: this.newAddressForm.value.cityId, // API için ID
        street: this.newAddressForm.value.street,
        houseNumber: this.newAddressForm.value.houseNumber,
        description: this.newAddressForm.value.description,
        isDefault: isDefault
      };

      if (newAddress.isDefault) {
        this.addressList.forEach(addr => addr.isDefault = false);
      }
      
      this.addressList.push(newAddress);
      this.isAddingNewAddress = false;
      this.currentAddressPage = this.totalAddressPages; 

    } else {
      console.error('Lütfen adres bilgilerini doğru giriniz.');
      this.newAddressForm.markAllAsTouched();
    }
  }

  // --- Adres Düzenleme/Silme İşlevleri (GÜNCELLENMİŞ) ---

  editAddress(address: Address) {
    this.isEditingAddress = true;
    this.isAddingNewAddress = false;
    this.editingAddressId = address.id;

    // Formu mevcut adres verileriyle doldur
    this.editAddressForm.setValue({
      title: address.title,
      cityId: address.cityId, // DİKKAT: cityId kullanıldı
      street: address.street,
      houseNumber: address.houseNumber,
      description: address.description,
      isDefault: address.isDefault
    });
    this.editAddressForm.markAsUntouched();
  }

  // ... (cancelEditAddress fonksiyonu değişmedi) ...
  cancelEditAddress() {
    this.isEditingAddress = false;
    this.editingAddressId = null;
    this.editAddressForm.reset();
  }


  saveEditedAddress() {
    if (this.editAddressForm.valid && this.editingAddressId !== null) {
      const updatedData = this.editAddressForm.value;
      const index = this.addressList.findIndex(a => a.id === this.editingAddressId);

      if (index !== -1) {
        if (updatedData.isDefault) {
          this.addressList.forEach(addr => addr.isDefault = false);
        }

        const selectedCity = this.cityList.find(c => c.id === updatedData.cityId);

        this.addressList[index] = {
          id: this.editingAddressId,
          ...updatedData,
          cityName: selectedCity ? selectedCity.name : 'Bilinmeyen Şehir', // Görüntüleme için isim
          cityId: updatedData.cityId // API için ID
        };
      }

      this.cancelEditAddress(); 
    } else {
      console.error('Lütfen adres düzenleme bilgilerini doğru giriniz.');
      this.editAddressForm.markAllAsTouched();
    }
  }

  // ... (deleteAddress ve Sayfalama İşlevleri değişmedi) ...
  deleteAddress(addressId: number) {
    if (confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
      const deletedAddress = this.addressList.find(a => a.id === addressId);
      this.addressList = this.addressList.filter(a => a.id !== addressId);
      
      if (deletedAddress?.isDefault && this.addressList.length > 0) {
        this.addressList[0].isDefault = true;
      }

      if (this.currentAddressPage > this.totalAddressPages && this.totalAddressPages > 0) {
        this.currentAddressPage = this.totalAddressPages;
      } else if (this.totalAddressPages === 0) {
        this.currentAddressPage = 1;
      }
    }
  }

  // --- Sayfalama İşlevleri (Değişmedi) ---

  getDisplayedAddresses(): Address[] {
    const startIndex = (this.currentAddressPage - 1) * this.addressesPerPage;
    const endIndex = startIndex + this.addressesPerPage;
    return this.addressList.slice(startIndex, endIndex);
  }

  shouldShowPrevArrow(): boolean {
    return this.addressList.length > this.addressesPerPage;
  }

  shouldShowNextArrow(): boolean {
    return this.addressList.length > this.addressesPerPage;
  }

  prevAddressPage() {
    if (this.currentAddressPage > 1) {
      this.currentAddressPage--;
    }
  }

  nextAddressPage() {
    if (this.currentAddressPage < this.totalAddressPages) {
      this.currentAddressPage++;
    }
  }
}