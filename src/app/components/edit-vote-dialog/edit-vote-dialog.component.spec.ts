import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditVoteDialogComponent } from './edit-vote-dialog.component';

describe('EditVoteDialogComponent', () => {
  let component: EditVoteDialogComponent;
  let fixture: ComponentFixture<EditVoteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditVoteDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditVoteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
