import { ComponentFixture, TestBed } from '@angular/core/testing';

import { B2c } from './b2c';

describe('B2c', () => {
  let component: B2c;
  let fixture: ComponentFixture<B2c>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [B2c]
    })
    .compileComponents();

    fixture = TestBed.createComponent(B2c);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
