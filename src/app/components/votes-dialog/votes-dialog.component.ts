import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CarServiceService, Vote } from '../../services/car-service.service';
import { CatDetailsDialogComponent } from '../cat-details-dialog/cat-details-dialog.component';
import { EditVoteDialogComponent } from '../edit-vote-dialog/edit-vote-dialog.component';

/**
 * VOTES DIALOG COMPONENT
 * Shows user's votes with tabs for all votes, breed-specific, and stats
 */
@Component({
  selector: 'app-votes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './votes-dialog.component.html',
  styleUrl: './votes-dialog.component.scss',
})
export class VotesDialogComponent implements OnInit {
  // ===== SERVICES =====
  protected catService = inject(CarServiceService);
  private dialogRef = inject(MatDialogRef<VotesDialogComponent>);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // ===== LOCAL CACHE =====
  private imageCache = new Map<string, string>(); // URL cache
  private voteImagesData = new Map<string, any>(); // Image data cache
  private loadingImages = new Set<string>(); // Loading state
  private fetchedImages = new Set<string>(); // Already fetched

  // ===== COMPUTED SIGNALS =====
  upvoteCount = computed(
    () => this.catService.userVotes().filter((v) => v.value === 1).length,
  );

  downvoteCount = computed(
    () => this.catService.userVotes().filter((v) => v.value === 0).length,
  );

  /** Votes filtered by current breed */
  breedSpecificVotes = computed(() => {
    const breedId = (this.catService as any).selectedBreedId();
    if (!breedId) return [];

    return this.catService.userVotes().filter((vote) => {
      const img =
        this.voteImagesData.get(vote.image_id) ||
        this.catService.images().find((i) => i.id === vote.image_id);
      return img?.breeds?.some((b: any) => b.id === breedId);
    });
  });

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.loadAllVoteImages();
  }

  // ===== IMAGE LOADING =====
  private loadAllVoteImages(): void {
    const votes = this.catService.userVotes();

    votes.forEach((vote) => {
      const id = vote.image_id;
      if (this.fetchedImages.has(id) || this.loadingImages.has(id)) return;

      const existing = this.catService.images().find((i) => i.id === id);

      if (existing) {
        this.voteImagesData.set(id, existing);
        this.fetchedImages.add(id);
      } else {
        this.loadingImages.add(id);
        this.catService.getImageById(id).subscribe({
          next: (img) => {
            if (img) this.voteImagesData.set(id, img);
            this.loadingImages.delete(id);
            this.fetchedImages.add(id);
          },
          error: () => {
            this.loadingImages.delete(id);
            this.fetchedImages.add(id);
          },
        });
      }
    });
  }

  // ===== TAB HANDLING =====
  onTabChange(): void {
    this.loadAllVoteImages();
  }

  // ===== IMAGE HELPERS =====
  getImageUrl(imageId: string): string {
    if (this.imageCache.has(imageId)) {
      return this.imageCache.get(imageId)!;
    }

    const data =
      this.voteImagesData.get(imageId) ||
      this.catService.images().find((i) => i.id === imageId);
    const url = data?.url || `https://api.thecatapi.com/v1/images/${imageId}`;

    this.imageCache.set(imageId, url);
    return url;
  }

  getBreedName(imageId: string): string {
    const data =
      this.voteImagesData.get(imageId) ||
      this.catService.images().find((i) => i.id === imageId);
    return data?.breeds?.[0]?.name || '';
  }

  isImageLoading(imageId: string): boolean {
    return this.loadingImages.has(imageId);
  }

  handleImageError(event: Event, imageId: string): void {
    const img = event.target as HTMLImageElement;

    if (img.src.includes('api.thecatapi.com')) {
      img.src = `https://cdn2.thecatapi.com/images/${imageId}.jpg`;
    } else {
      img.src =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='180' viewBox='0 0 250 180'%3E%3Crect width='250' height='180' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EImage Not Available%3C/text%3E%3C/svg%3E";
    }
    img.onerror = null;
  }

  // ===== VOTE ACTIONS =====
  deleteVote(voteId: number, imageId: string): void {
    this.catService.deleteVote(voteId);

    // Clean local cache
    this.voteImagesData.delete(imageId);
    this.imageCache.delete(imageId);
    this.fetchedImages.delete(imageId);

    this.snackBar.open('Vote deleted', 'Close', { duration: 2000 });

    if (this.catService.userVotes().length === 0) {
      setTimeout(() => this.close(), 500);
    }
  }

  editVote(vote: Vote): void {
    const dialogRef = this.dialog.open(EditVoteDialogComponent, {
      data: { vote },
      width: '400px',
      panelClass: 'edit-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadAllVoteImages();
    });
  }

  viewDetails(imageId: string): void {
    this.dialog.open(CatDetailsDialogComponent, {
      data: { imageId },
      width: '90%',
      maxWidth: '800px',
      panelClass: 'cat-details-dialog-panel',
      autoFocus: false,
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
