import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { CarServiceService } from '../../services/car-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CatDetailsDialogComponent } from '../cat-details-dialog/cat-details-dialog.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * FAVORITES DIALOG COMPONENT
 * Shows user's favorite cats with tabs for all favorites and breed-specific views
 */
@Component({
  selector: 'app-favorites-dialog',
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
  templateUrl: './favorites-dialog.component.html',
  styleUrl: './favorites-dialog.component.scss',
})
export class FavoritesDialogComponent implements OnInit {
  // ===== SERVICES =====
  protected catService = inject(CarServiceService);
  private dialogRef = inject(MatDialogRef<FavoritesDialogComponent>);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // ===== LOCAL CACHE =====
  private imageCache = new Map<string, string>(); // URL cache
  private favoriteImagesData = new Map<string, any>(); // Image data cache
  private loadingImages = new Set<string>(); // Loading state
  private fetchedImages = new Set<string>(); // Already fetched

  // ===== COMPUTED SIGNALS =====
  /** Favorites filtered by currently selected breed */
  breedSpecificFavorites = computed(() => {
    const breedId = (this.catService as any).selectedBreedId();
    if (!breedId) return [];

    return this.catService.userFavorites().filter((fav) => {
      const img =
        this.catService['favoriteImagesData']().get(fav.image_id) ||
        this.catService.images().find((i) => i.id === fav.image_id);
      return img?.breeds?.some((b: any) => b.id === breedId);
    });
  });

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.catService.loadAllFavoriteImages();
  }

  // ===== TAB HANDLING =====
  onTabChange(): void {
    this.catService.loadAllFavoriteImages();
  }

  // ===== IMAGE HELPERS =====
  getImageUrl(imageId: string): string {
    return this.catService.getFavoriteImageUrl(imageId);
  }

  getBreedName(imageId: string): string {
    return this.catService.getFavoriteBreedName(imageId);
  }

  isImageLoading(imageId: string): boolean {
    return this.catService.isFavoriteImageLoading(imageId);
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

  // ===== FAVORITE ACTIONS =====
  removeFavorite(favoriteId: number, imageId: string): void {
    // Optimistic update - remove immediately
    this.catService.deleteFromFavorites(favoriteId);

    // Clean local cache
    this.favoriteImagesData.delete(imageId);
    this.imageCache.delete(imageId);
    this.fetchedImages.delete(imageId);

    this.snackBar.open('Removed from favorites', 'Close', { duration: 2000 });

    // Close dialog if no favorites left
    if (this.catService.userFavorites().length === 0) {
      setTimeout(() => this.close(), 500);
    }
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
