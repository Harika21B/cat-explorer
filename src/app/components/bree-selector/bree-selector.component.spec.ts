import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreeSelectorComponent } from './bree-selector.component';

describe('BreeSelectorComponent', () => {
  let component: BreeSelectorComponent;
  let fixture: ComponentFixture<BreeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreeSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BreeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
