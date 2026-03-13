import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VotesDialogComponent } from './votes-dialog.component';

describe('VotesDialogComponent', () => {
  let component: VotesDialogComponent;
  let fixture: ComponentFixture<VotesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotesDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VotesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
