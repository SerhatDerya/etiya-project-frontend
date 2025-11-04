import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer-service'; 
import { CustomerListResponse } from '../../models/customerListResponse'; 
import { Router } from '@angular/router'; // Yönlendirme için eklendi

@Component({
  selector: 'app-customer-info',
  standalone: true, 
  imports: [
    ReactiveFormsModule, 
    CommonModule, // *ngFor, *ngIf ve ng-template için gerekli
  ],
  templateUrl: './customer-info.html',
  styleUrls: ['./customer-info.scss']
})
export class CustomerInfo implements OnInit {
  currentStep: number = 1; // 1: Customer Info, 2: Customer Account, 3: Address Info, 4: Contact Medium
  customerForm!: FormGroup;
  
  editingSteps: { [key: number]: boolean } = { 1: false, 2: false, 3: false, 4: false }; 
  formBackup: any = {};
  
  // URL'den veya başka bir yerden alınması gereken müşteri ID'si simülasyonu
  private customerId: string = '987654'; 

  customerInfoControls = ['firstName', 'lastName', 'gender', 'motherName', 'middleName', 'birthDate', 'fatherName', 'nationalityId'];
  customerAccountControls: string[] = []; 
  addressInfoControls: string[] = []; 
  contactMediumControls = ['email', 'mobilePhone', 'homePhone', 'fax'];
  
  private labels: { [key: string]: string } = {
    firstName: 'First Name',
    lastName: 'Last Name',
    gender: 'Gender',
    motherName: 'Mother Name',
    middleName: 'Middle Name (Optional)',
    birthDate: 'Birth Date',
    fatherName: 'Father Name',
    nationalityId: 'Nationality ID',
    email: 'E-mail',
    mobilePhone: 'Mobile Phone',
    homePhone: 'Home Phone (Optional)',
    fax: 'Fax (Optional)'
  };

  constructor(private fb: FormBuilder, private customerService: CustomerService, private router: Router) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCustomerData();
    
    // Formu başlangıçta salt okunur yapmak için tüm kontrolleri devre dışı bırak
    this.disableFormControls(1);
  }
  
  initializeForm(): void {
    this.customerForm = this.fb.group({
      // 1. Customer Info Group (Demografik/API'dan gelen veriler)
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      motherName: [''],
      middleName: [''],
      birthDate: ['', Validators.required], 
      fatherName: [''],
      nationalityId: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]], 

      // 2. Customer Account Group (Boş)
      account: this.fb.group({
         // Şimdilik boş
      }),

      // 3. Address Info Group (Boş/Simülasyon)
      address: this.fb.group({
        country: [''],
        city: [''],
      }),

      // 4. Contact Medium Group (Simülasyon/Manuel)
      email: ['', [Validators.required, Validators.email]],
      mobilePhone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      homePhone: [''],
      fax: ['']
    });
  }

  loadCustomerData(): void {
    const params = new URLSearchParams();
    params.append('natId', "22345678988"); 
    
    this.customerService.getCustomers(params).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          const customerData = response[0];
          this.patchCustomerInfo(customerData);
        } else {
          console.warn('Müşteri verisi bulunamadı. Simülasyon verileri kullanılıyor.');
          this.patchDefaultValues();
        }
      },
      error: (error) => {
        console.error('Müşteri verisi çekilirken hata oluştu:', error);
        this.patchDefaultValues();
      }
    });
  }

  // API'dan gelen veriyi form kontrollerine eşler
  private patchCustomerInfo(data: CustomerListResponse): void {
    this.customerForm.patchValue({
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      birthDate: data.dateOfBirth, // API alanı: dateOfBirth
      gender: data.gender,
      motherName: data.motherName,
      fatherName: data.fatherName,
      nationalityId: data.natId, // API alanı: natId
      
      // API'dan gelmeyen diğer alanlar için varsayılan değerler
      email: 'customer@loaded.com', 
      mobilePhone: '5559998877', 
      address: { country: 'Türkiye', city: 'Ankara' }
    });
    
    this.formBackup = this.customerForm.value;
  }
  
  // Veri gelmezse veya hata olursa kullanılacak simülasyon/başlangıç verileri
  private patchDefaultValues(): void {
    this.customerForm.patchValue({
      firstName: 'Simülasyon',
      lastName: 'Müşterisi',
      gender: 'other',
      birthDate: '1970-01-01',
      nationalityId: '00000000000',
      email: 'default@test.com',
      mobilePhone: '5551234567',
      address: { country: 'World', city: 'Virtual' }
    });
    this.formBackup = this.customerForm.value;
  }

  // --- Navigasyon ve Düzenleme Metotları ---

  selectStep(step: number): void {
    if (this.currentStep !== step) {
      if (this.editingSteps[this.currentStep]) {
        console.warn(`Lütfen önce adım ${this.currentStep} üzerindeki düzenlemeyi kaydedin veya iptal edin.`);
        return; 
      }
      this.currentStep = step;
    }
  }

  enableEdit(step: number): void {
    if (step === 2 || step === 3) return; // Account ve Address düzenlenemez
    this.editingSteps[step] = true;
    this.formBackup = JSON.parse(JSON.stringify(this.customerForm.value)); // Derin kopya al
    this.enableFormControls(step);
  }

  cancelEdit(step: number): void {
    this.editingSteps[step] = false;
    this.customerForm.patchValue(this.formBackup); 
    this.disableFormControls(step);
    this.customerForm.markAsPristine(); 
    this.customerForm.markAsUntouched();
  }

  saveChanges(step: number): void {
    if (this.isStepValid(step)) {
      this.editingSteps[step] = false;
      this.disableFormControls(step);
      this.formBackup = JSON.parse(JSON.stringify(this.customerForm.value)); // Yeni veriyi yedekle
      console.log(`Adım ${step} kaydedildi. Yeni Veriler:`, this.customerForm.value);
      alert(`Adım ${step} bilgileri başarıyla güncellendi!`);
    } else {
      console.error(`Adım ${step} geçersiz. Lütfen zorunlu alanları doldurun.`);
      this.markControlsAsTouched(step); 
    }
  }

  // --- Yardımcı Metotlar ---
  
  private disableFormControls(step: number = 0): void {
    const controls = this.getControlsForStep(step);
    controls.forEach(controlName => this.customerForm.get(controlName)?.disable());
  }

  private enableFormControls(step: number): void {
    const controls = this.getControlsForStep(step);
    controls.forEach(controlName => this.customerForm.get(controlName)?.enable());
  }

  private getControlsForStep(step: number): string[] {
    switch (step) {
      case 1:
        return this.customerInfoControls;
      case 2:
        return this.customerAccountControls; 
      case 3:
        return this.addressInfoControls; 
      case 4:
        return this.contactMediumControls;
      default:
        // Tüm alanları döndür (ngOnInit için)
        return [...this.customerInfoControls, ...this.contactMediumControls];
    }
  }

  isStepValid(step: number): boolean {
    const controls = this.getControlsForStep(step);
    
    if (step === 2 || step === 3) return true; // Boş adımlar her zaman geçerli

    return controls.every(c => this.customerForm.get(c)?.valid);
  }

  private markControlsAsTouched(step: number): void {
    const controls = this.getControlsForStep(step);
    controls.forEach(controlName => this.customerForm.get(controlName)?.markAsTouched());
  }

  isEditingStep(step: number): boolean {
    return this.editingSteps[step];
  }
  
  getLabel(controlName: string): string {
    return this.labels[controlName] || controlName;
  }
  
  getInputType(controlName: string): string {
    switch (controlName) {
      case 'birthDate': return 'date';
      case 'email': return 'email';
      default: return 'text';
    }
  }
}