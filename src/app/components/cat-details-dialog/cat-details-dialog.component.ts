import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CarServiceService,
  CatImage,
} from '../../services/car-service.service';

// Data passed to dialog when opened
export interface CatDetailsDialogData {
  imageId: string;
}

@Component({
  selector: 'app-cat-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cat-details-dialog.component.html',
  styleUrl: './cat-details-dialog.component.scss',
})
export class CatDetailsDialogComponent {
  // Services
  private catService = inject(CarServiceService);
  private dialogRef = inject(MatDialogRef<CatDetailsDialogComponent>);

  // State
  catDetails: CatImage | null = null;
  loading = true;

  // Breed details (flattened from breed object)
  breedName = '';
  origin = '';
  description = '';
  temperament = '';
  lifeSpan = '';
  adaptability = 0;
  affectionLevel = 0;
  childFriendly = 0;
  dogFriendly = 0;
  energyLevel = 0;
  intelligence = 0;
  wikipediaUrl = '';
  isFavorite = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: CatDetailsDialogData) {
    // Load data when dialog opens
    this.loadCatDetails();
  }

  // Fetch cat details from API
  private loadCatDetails(): void {
    this.loading = true;

    this.catService.getImageById(this.data.imageId).subscribe({
      next: (details) => {
        if (details) {
          this.catDetails = details;
          this.isFavorite = this.catService.isFavorite(details.id);

          // Extract breed info if available
          if (details.breeds && details.breeds.length > 0) {
            const breed = details.breeds[0];
            this.breedName = breed.name;
            this.origin = breed.origin;
            this.description = breed.description;
            this.temperament = breed.temperament;
            this.lifeSpan = breed.life_span;
            this.adaptability = breed.adaptability;
            this.affectionLevel = breed.affection_level;
            this.childFriendly = breed.child_friendly;
            this.dogFriendly = breed.dog_friendly;
            this.energyLevel = breed.energy_level;
            this.intelligence = breed.intelligence;
            this.wikipediaUrl = breed.wikipedia_url || '';
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // Fallback if image fails to load
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23999'%3EImage Not Available%3C/text%3E%3C/svg%3E";
    img.onerror = null;
  }

  // Add/remove from favorites
  toggleFavorite(): void {
    if (!this.catDetails) return;

    if (this.isFavorite) {
      const favId = this.catService.getFavoriteId(this.catDetails.id);
      if (favId) {
        this.catService.removeFromFavorites(favId);
      }
    } else {
      this.catService.addToFavorites(this.catDetails.id);
    }

    this.isFavorite = !this.isFavorite;
  }

  // Close dialog
  close(): void {
    this.dialogRef.close();
  }
}
