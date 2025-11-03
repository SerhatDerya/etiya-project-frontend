import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCustomer } from './create-customer';

describe('CreateCustomer', () => {
  let component: CreateCustomer;
  let fixture: ComponentFixture<CreateCustomer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCustomer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCustomer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
