import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatDetailsDialogComponent } from './cat-details-dialog.component';

describe('CatDetailsDialogComponent', () => {
  let component: CatDetailsDialogComponent;
  let fixture: ComponentFixture<CatDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatDetailsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CatDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
