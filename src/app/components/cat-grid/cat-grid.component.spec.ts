import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatGridComponent } from './cat-grid.component';

describe('CatGridComponent', () => {
  let component: CatGridComponent;
  let fixture: ComponentFixture<CatGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatGridComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CatGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
