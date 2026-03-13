import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CarServiceService, Vote } from '../../services/car-service.service';

// Data passed to dialog when opened
export interface EditVoteDialogData {
  vote: Vote;
}

/**
 * EDIT VOTE DIALOG COMPONENT
 *
 * Allows users to change their vote from upvote to downvote or vice versa.
 * Opens when user clicks edit on a vote in the votes dialog.
 */
@Component({
  selector: 'app-edit-vote-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './edit-vote-dialog.component.html',
  styleUrl: './edit-vote-dialog.component.scss',
})
export class EditVoteDialogComponent {
  // Services
  private catService = inject(CarServiceService);
  private dialogRef = inject(MatDialogRef<EditVoteDialogComponent>);
  private snackBar = inject(MatSnackBar);

  // Selected vote value (1 = upvote, 0 = downvote)
  selectedValue: number;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { vote: any }) {
    // Initialize with current vote value
    this.selectedValue = data.vote.value;
  }

  /**
   * Checks if user changed the vote
   * Used to enable/disable save button
   */
  hasChanged(): boolean {
    return this.selectedValue !== this.data.vote.value;
  }

  /**
   * Saves the updated vote
   * Calls service to update, shows feedback, closes dialog
   */
  save(): void {
    // Update vote in backend
    this.catService.updateVote(
      this.data.vote.id,
      this.data.vote.image_id,
      this.selectedValue,
    );

    // Show success message
    this.snackBar.open(
      this.selectedValue === 1
        ? '👍 Changed to upvote!'
        : '👎 Changed to downvote!',
      'Close',
      { duration: 2000 },
    );

    // Close dialog and return success
    this.dialogRef.close(true);
  }

  /**
   * Cancels editing
   * Closes dialog without saving
   */
  cancel(): void {
    this.dialogRef.close();
  }
}
