// create-customer.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// CommonModule'e artık gerek yok, çünkü *ngIf yerine @if kullanıyoruz.

@Component({
  selector: 'app-create-customer',
  standalone: true, // Angular 17+ Standalone Component
  imports: [
    ReactiveFormsModule, // Form yönetimini sağlar
    // CommonModule artık gerekli değil
  ],
  templateUrl: './create-customer.html',
  styleUrls: ['./create-customer.scss']
})
export class CreateCustomer implements OnInit {
  currentStep: number = 1; // 1: Demographic Info, 2: Address Info, 3: Contact Medium
  customerForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      // 1. Demographic Info Group
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      motherName: [''],
      middleName: [''],
      birthDate: ['', Validators.required],
      fatherName: [''],
      nationalityId: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],

      // 2. Address Info Group
      address: this.fb.group({
        country: [''],
        city: [''],
        // ... diğer adres alanları
      }),

      // 3. Contact Medium Group
      email: ['', [Validators.required, Validators.email]],
      mobilePhone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      homePhone: [''],
      fax: ['']
    });
  }

  // Next butonuna tıklama işlevi
  nextStep() {
    if (this.currentStep === 1) {
      const demographicInfoControls = ['firstName', 'lastName', 'gender', 'birthDate', 'nationalityId'];
      const isStep1Valid = demographicInfoControls.every(c => this.customerForm.get(c)?.valid);
      
      if (isStep1Valid) {
        this.currentStep = 2;
      } else {
        // Kullanıcıya uyarı gösterilebilir
        console.error('Lütfen Demografik Bilgileri doğru giriniz.');
      }
    } else if (this.currentStep === 2) {
      // Adres bilgileri şu an boş olduğu için her zaman ilerlemesine izin verelim.
      this.currentStep = 3;
    }
  }

  // Previous butonuna tıklama işlevi
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onCancel() {
    this.router.navigateByUrl('/b2c');
  }

  // Create butonuna tıklama işlevi
  createCustomer() {
    if (this.customerForm.valid) {
      console.log('Müşteri Oluşturuluyor:', this.customerForm.value);
      // API çağrısı burada yapılabilir
      alert('Müşteri Başarıyla Oluşturuldu!');
    } else {
      console.error('Form geçersiz. Lütfen tüm alanları doldurun.');
      // Formdaki hatalı alanları işaretlemek için ek mantık eklenebilir.
      this.customerForm.markAllAsTouched();
    }
  }
}