import {
  Component,
  inject,
  computed,
  output,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSpinner } from '@angular/material/progress-spinner';

import { CatGridComponent } from './components/cat-grid/cat-grid.component';
import { BreeSelectorComponent } from './components/bree-selector/bree-selector.component';
import { FavoritesDialogComponent } from './components/favorites-dialog/favorites-dialog.component';
import { CatDetailsDialogComponent } from './components/cat-details-dialog/cat-details-dialog.component';
import { VotesDialogComponent } from './components/votes-dialog/votes-dialog.component';
import { CarServiceService } from './services/car-service.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatSnackBarModule,
    MatSpinner,
    CatGridComponent,
    BreeSelectorComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  // ===== SERVICES =====
  protected catService = inject(CarServiceService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // ===== UI STATE =====
  selectedTabIndex = 0; // 0=Random, 1=Favorites, 2=Votes
  favoriteToggled = output<string>();

  // Triggers for forcing computed signals to update
  private voteUpdateTrigger = signal(0);
  private favoriteUpdateTrigger = signal(0);

  // ===== COMPUTED SIGNALS =====

  /** Favorites filtered by selected breed */
  favoriteCats = computed(() => {
    this.favoriteUpdateTrigger(); // Force re-run when needed
    const breedId = (this.catService as any).selectedBreedId();
    const all = this.catService.favoriteImagesList();

    return !breedId
      ? all
      : all.filter((cat) => cat.breeds?.some((b) => b.id === breedId));
  });

  /** Votes filtered by selected breed */
  votedCats = computed(() => {
    this.voteUpdateTrigger(); // Force re-run when needed
    const breedId = (this.catService as any).selectedBreedId();
    const all = this.catService.votedImagesList();

    return !breedId
      ? all
      : all.filter((cat) => cat.breeds?.some((b) => b.id === breedId));
  });

  // ===== LIFECYCLE =====
  ngOnInit() {
    // Safety timeout - prevents infinite loading
    setTimeout(() => {
      if (this.catService.isLoading()) {
        console.warn('Loading timeout - forcing reset');
        (this.catService as any).forceLoadingFalse();
      }
    }, 5000);
  }

  // ===== REFRESH METHODS =====
  refreshFavoritesTab(): void {
    this.catService.fetchFavorites();
    this.favoriteUpdateTrigger.update((v) => v + 1);
  }

  refreshVotesTab(): void {
    this.catService.fetchVotes();
    this.voteUpdateTrigger.update((v) => v + 1);
  }

  // ===== TAB HANDLING =====
  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;

    if (event.index === 1) {
      // Favorites tab
      this.catService.fetchFavorites();
      this.favoriteUpdateTrigger.update((v) => v + 1);
    } else if (event.index === 2) {
      // Votes tab
      this.catService.fetchVotes();
      this.voteUpdateTrigger.update((v) => v + 1);
    }
  }

  // ===== DIALOGS =====
  openFavoritesDialog(): void {
    const dialogRef = this.dialog.open(FavoritesDialogComponent, {
      width: '90%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      panelClass: 'favorites-dialog',
    });

    dialogRef.afterClosed().subscribe(() => {
      if (this.selectedTabIndex === 1) this.refreshFavoritesTab();
    });
  }

  openVotesDialog(): void {
    const dialogRef = this.dialog.open(VotesDialogComponent, {
      width: '90%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      panelClass: 'votes-dialog-panel',
    });

    dialogRef.afterClosed().subscribe(() => {
      if (this.selectedTabIndex === 2) this.refreshVotesTab();
    });
  }

  viewCatDetails(catId: string): void {
    this.dialog.open(CatDetailsDialogComponent, {
      data: { imageId: catId },
      width: '90%',
      maxWidth: '800px',
      panelClass: 'cat-details-dialog-panel',
      autoFocus: false,
    });
  }

  // ===== BREED SELECTION =====
  onBreedSelected(breedId: string): void {
    this.catService.fetchRandomCats(10, breedId || undefined);
    if (this.selectedTabIndex !== 0) this.selectedTabIndex = 0;
  }

  getCurrentBreedDisplay(): string {
    const name = this.catService.selectedBreedName();
    return name === 'All Breeds' ? '' : ` for ${name}`;
  }

  // ===== FAVORITE ACTIONS =====
  toggleFavorite(imageId: string): void {
    const favId = this.catService.getFavoriteId(imageId);
    favId
      ? this.catService.removeFromFavorites(favId)
      : this.catService.addToFavorites(imageId);
    this.favoriteToggled.emit(imageId);
  }

  onFavoriteToggled(event: any): void {
    const imageId = typeof event === 'string' ? event : event?.toString() || '';
    if (!imageId) return;

    const msg = this.catService.isFavorite(imageId)
      ? '❤️ Added to favorites!'
      : '💔 Removed from favorites';
    this.snackBar.open(msg, 'Close', { duration: 2000 });
  }

  // ===== VOTE ACTIONS =====
  handleVote(vote: { id: string; value: number }): void {
    this.catService.voteForCat(vote.id, vote.value);
    const msg =
      vote.value === 1 ? '👍 Voted for cat!' : '👎 Voted against cat!';
    this.snackBar.open(msg, 'Close', { duration: 2000 });
  }

  // ===== TAB NAVIGATION =====
  switchToFavoritesTab(): void {
    this.selectedTabIndex = 1;
    this.catService.fetchFavorites();
  }

  switchToRandomTab(): void {
    this.selectedTabIndex = 0;
  }
}
