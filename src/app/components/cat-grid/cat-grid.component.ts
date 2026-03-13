import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {
  CarServiceService,
  CatImage,
} from '../../services/car-service.service';

/**
 * CAT GRID COMPONENT
 *
 * Displays a grid of cat cards with images and action buttons.
 * Acts as a presentational component that receives data via inputs
 * and emits events for user interactions.
 */
@Component({
  selector: 'app-cat-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './cat-grid.component.html',
  styleUrl: './cat-grid.component.scss',
})
export class CatGridComponent {
  // Services
  private catService = inject(CarServiceService);

  // ========== INPUTS ==========
  /** Array of cat images to display in the grid */
  cats = input.required<CatImage[]>();

  // ========== OUTPUTS ==========
  /** Emits when user votes on a cat (value: 1=up, 0=down) */
  vote = output<{ id: string; value: number }>();

  /** Emits when user clicks to view cat details */
  viewDetails = output<string>();

  // ========== FAVORITE METHODS ==========

  /** Checks if a cat is in user's favorites */
  isFavorite(imageId: string): boolean {
    return this.catService.isFavorite(imageId);
  }

  /** Adds or removes a cat from favorites */
  toggleFavorite(imageId: string): void {
    const favId = this.catService.getFavoriteId(imageId);

    if (favId) {
      // Remove from favorites if already favorited
      this.catService.removeFromFavorites(favId);
    } else {
      // Add to favorites if not favorited
      this.catService.addToFavorites(imageId);
    }
  }
}
