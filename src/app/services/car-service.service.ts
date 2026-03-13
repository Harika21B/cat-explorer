import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

// ===== INTERFACES =====
export interface CatImage {
  id: string;
  url: string;
  width: number;
  height: number;
  breeds?: Breed[];
}

export interface Breed {
  id: string;
  name: string;
  temperament: string;
  origin: string;
  description: string;
  life_span: string;
  adaptability: number;
  affection_level: number;
  child_friendly: number;
  dog_friendly: number;
  energy_level: number;
  intelligence: number;
  wikipedia_url?: string;
  reference_image_id?: string;
}

export interface Vote {
  id?: number;
  image_id: string;
  value: number;
  sub_id?: string;
  created_at?: string;
  country_code?: string;
}

export interface Favorite {
  id?: number;
  image_id: string;
  sub_id?: string;
  created_at?: string;
  note?: string;
  category?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CarServiceService {
  // ===== DEPENDENCIES =====
  private http = inject(HttpClient);
  private baseUrl = '/api';
  private apiKey = environment.catApiKey;
  private snackBar = inject(MatSnackBar, { optional: true });

  // ===== STATE SIGNALS =====
  private breedsList = signal<Breed[]>([]);
  private catImages = signal<CatImage[]>([]);
  private votes = signal<Vote[]>([]);
  private favorites = signal<Favorite[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);
  private selectedBreedId = signal<string>('');

  // ===== IMAGE CACHE SIGNALS =====
  private favoriteImagesData = signal<Map<string, CatImage>>(new Map());
  private loadingImages = signal<Set<string>>(new Set());
  private fetchedImages = signal<Set<string>>(new Set());

  private votedImagesData = signal<Map<string, CatImage>>(new Map());
  private loadingVotedImages = signal<Set<string>>(new Set());
  private fetchedVotedImages = signal<Set<string>>(new Set());

  // ===== PUBLIC READONLY SIGNALS =====
  public breeds = this.breedsList.asReadonly();
  public images = this.catImages.asReadonly();
  public userVotes = this.votes.asReadonly();
  public userFavorites = this.favorites.asReadonly();
  public isLoading = this.loading.asReadonly();
  public errorMessage = this.error.asReadonly();

  // ===== COMPUTED SIGNALS =====
  public selectedBreed = computed(() =>
    this.breedsList().find((b) => b.id === this.selectedBreedId()),
  );

  public favoriteImagesList = computed(() =>
    Array.from(this.favoriteImagesData().values()),
  );

  public votedImagesList = computed(() =>
    Array.from(this.votedImagesData().values()),
  );

  public selectedBreedName = computed(() => {
    const id = this.selectedBreedId();
    if (!id) return 'All Breeds';
    const breed = this.breedsList().find((b) => b.id === id);
    return breed ? breed.name : 'All Breeds';
  });

  public breedSpecificFavorites = computed(() => {
    const breedId = this.selectedBreedId();
    if (!breedId) return 0;

    const breedImages = this.images().filter((img) =>
      img.breeds?.some((b) => b.id === breedId),
    );

    return breedImages.filter((img) =>
      this.favorites().some((f) => f.image_id === img.id),
    ).length;
  });

  public breedSpecificVotes = computed(() => {
    const breedId = this.selectedBreedId();
    if (!breedId) return 0;

    const breedImages = this.images().filter((img) =>
      img.breeds?.some((b) => b.id === breedId),
    );

    return breedImages.filter((img) =>
      this.votes().some((v) => v.image_id === img.id),
    ).length;
  });

  // ===== HTTP HEADERS =====
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
  }

  // ===== CONSTRUCTOR =====
  constructor() {
    this.fetchBreeds();
    this.fetchRandomCats();
    this.fetchVotes();
    this.fetchFavorites();
  }

  // ===== IMAGE LOADING METHODS =====

  /** Loads images for all favorites */
  loadAllFavoriteImages(): void {
    const favorites = this.favorites();

    favorites.forEach((fav) => {
      const imageId = fav.image_id;
      if (
        this.fetchedImages().has(imageId) ||
        this.loadingImages().has(imageId)
      )
        return;

      const existing = this.images().find((img) => img.id === imageId);

      if (existing) {
        this.favoriteImagesData.update(
          (map) => new Map(map.set(imageId, existing)),
        );
        this.fetchedImages.update((set) => new Set(set.add(imageId)));
      } else {
        this.loadingImages.update((set) => new Set(set.add(imageId)));

        this.getImageById(imageId).subscribe({
          next: (image) => {
            if (image)
              this.favoriteImagesData.update(
                (map) => new Map(map.set(imageId, image)),
              );
            this.loadingImages.update((set) => {
              set.delete(imageId);
              return new Set(set);
            });
            this.fetchedImages.update((set) => new Set(set.add(imageId)));
          },
          error: () => {
            this.loadingImages.update((set) => {
              set.delete(imageId);
              return new Set(set);
            });
            this.fetchedImages.update((set) => new Set(set.add(imageId)));
          },
        });
      }
    });
  }

  /** Loads images for all voted cats */
  loadAllVotedImages(): void {
    const votes = this.votes();
    if (votes.length === 0) {
      this.votedImagesData.set(new Map());
      this.loading.set(false);
      return;
    }

    let completed = 0;
    const total = votes.length;

    votes.forEach((vote) => {
      const imageId = vote.image_id;
      const existing = this.images().find((img) => img.id === imageId);

      if (existing) {
        this.votedImagesData.update(
          (map) => new Map(map.set(imageId, existing)),
        );
        completed++;
        if (completed === total) this.loading.set(false);
        return;
      }

      this.getImageById(imageId).subscribe({
        next: (image) => {
          if (image)
            this.votedImagesData.update(
              (map) => new Map(map.set(imageId, image)),
            );
          completed++;
          if (completed === total) this.loading.set(false);
        },
        error: () => {
          completed++;
          if (completed === total) this.loading.set(false);
        },
      });
    });
  }

  // ===== HELPER METHODS =====

  getFavoriteImageUrl(imageId: string): string {
    const data =
      this.favoriteImagesData().get(imageId) ||
      this.images().find((img) => img.id === imageId);
    return data?.url || `https://api.thecatapi.com/v1/images/${imageId}`;
  }

  getFavoriteBreedName(imageId: string): string {
    const data =
      this.favoriteImagesData().get(imageId) ||
      this.images().find((img) => img.id === imageId);
    return data?.breeds?.[0]?.name || '';
  }

  isFavoriteImageLoading(imageId: string): boolean {
    return this.loadingImages().has(imageId);
  }

  getVotedImageUrl(imageId: string): string {
    const data =
      this.votedImagesData().get(imageId) ||
      this.images().find((img) => img.id === imageId);
    return data?.url || `https://api.thecatapi.com/v1/images/${imageId}`;
  }

  getVotedBreedName(imageId: string): string {
    const data =
      this.votedImagesData().get(imageId) ||
      this.images().find((img) => img.id === imageId);
    return data?.breeds?.[0]?.name || '';
  }

  isVotedImageLoading(imageId: string): boolean {
    return this.loadingVotedImages().has(imageId);
  }

  isFavorite(imageId: string): boolean {
    return this.favorites().some((f) => f.image_id === imageId);
  }

  getFavoriteId(imageId: string): number | undefined {
    return this.favorites().find((f) => f.image_id === imageId)?.id;
  }

  getUserVotesForImage(imageId: string): Vote[] {
    return this.votes().filter((v) => v.image_id === imageId);
  }

  getUserVoteValue(imageId: string): number | null {
    const vote = this.votes().find((v) => v.image_id === imageId);
    return vote ? vote.value : null;
  }

  forceLoadingFalse(): void {
    this.loading.set(false);
  }

  clearError(): void {
    this.error.set(null);
  }

  // ===== API CALLS - BREEDS =====

  /** GET /breeds - List all breeds */
  fetchBreeds(): void {
    this.loading.set(true);
    this.http
      .get<Breed[]>(`${this.baseUrl}/breeds`, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Failed to load breeds', err);
          this.error.set('Failed to load breeds');
          return of([]);
        }),
      )
      .subscribe((breeds) => {
        this.breedsList.set(breeds);
        this.loading.set(false);
      });
  }

  // ===== API CALLS - IMAGES =====

  /** GET /images/search - Search for cats */
  fetchRandomCats(limit: number = 10, breedId?: string): void {
    this.loading.set(true);
    let url = `${this.baseUrl}/images/search?limit=${limit}&has_breeds=1`;

    if (breedId) {
      url += `&breed_ids=${breedId}`;
      this.selectedBreedId.set(breedId);
    } else {
      this.selectedBreedId.set('');
    }

    this.http
      .get<CatImage[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Failed to load cat images', err);
          this.error.set('Failed to load cat images');
          return of([]);
        }),
      )
      .subscribe((images) => {
        this.catImages.set(images);
        this.loading.set(false);
      });
  }

  /** GET /images/{image_id} - Get specific image */
  getImageById(imageId: string) {
    return this.http
      .get<CatImage>(`${this.baseUrl}/images/${imageId}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Failed to load image details', err);
          return of(null);
        }),
      );
  }

  /** GET /images/{image_id}/analysis - Get image analysis */
  analyzeImage(imageId: string) {
    return this.http
      .get(`${this.baseUrl}/images/${imageId}/analysis`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Analysis failed', err);
          return of({ error: 'Analysis not available' });
        }),
      );
  }

  // ===== API CALLS - VOTES =====

  /** POST /votes - Vote on a cat */
  voteForCat(imageId: string, value: number): void {
    const voteData = {
      image_id: imageId,
      value: value,
      sub_id: 'angular-cat-explorer',
    };

    this.http
      .post<Vote>(`${this.baseUrl}/votes`, voteData, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Failed to submit vote', err);
          this.error.set('Failed to submit vote');
          return of(null);
        }),
      )
      .subscribe((response) => {
        if (response) this.fetchVotes();
      });
  }

  /** GET /votes - Get all votes for your sub_id */
  fetchVotes(): void {
    this.loading.set(true);
    this.http
      .get<Vote[]>(`${this.baseUrl}/votes?sub_id=angular-cat-explorer`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Failed to load votes', err);
          this.loading.set(false);
          return of([]);
        }),
      )
      .subscribe((votes) => {
        this.votes.set(votes);
        this.loadAllVotedImages();
      });
  }

  /** DELETE /votes/{vote_id} - Delete a vote */
  deleteVote(voteId: number): void {
    const voteToDelete = this.votes().find((v) => v.id === voteId);
    if (!voteToDelete) return;

    // Optimistic update
    this.votes.update((votes) => votes.filter((v) => v.id !== voteId));

    const stillHasVotes = this.votes().some(
      (v) => v.image_id === voteToDelete.image_id,
    );
    if (!stillHasVotes) {
      this.votedImagesData.update((map) => {
        map.delete(voteToDelete.image_id);
        return new Map(map);
      });
    }

    this.http
      .delete(`${this.baseUrl}/votes/${voteId}`, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Failed to delete vote', err);
          this.fetchVotes(); // Revert on error
          this.snackBar?.open('Failed to delete vote', 'Close', {
            duration: 3000,
          });
          return of(null);
        }),
      )
      .subscribe(() => {
        this.snackBar?.open('Vote deleted', 'Close', { duration: 2000 });
      });
  }

  /** PUT /votes/{vote_id} - Update a vote (delete + create) */
  updateVote(voteId: number, imageId: string, newValue: number): void {
    const oldVote = this.votes().find((v) => v.id === voteId);

    // Optimistic update
    this.votes.update((votes) =>
      votes.map((v) => (v.id === voteId ? { ...v, value: newValue } : v)),
    );

    this.loading.set(true);

    this.http
      .delete(`${this.baseUrl}/votes/${voteId}`, { headers: this.getHeaders() })
      .pipe(
        switchMap(() => {
          const voteData = {
            image_id: imageId,
            value: newValue,
            sub_id: 'angular-cat-explorer',
          };
          return this.http.post<Vote>(`${this.baseUrl}/votes`, voteData, {
            headers: this.getHeaders(),
          });
        }),
        catchError((err) => {
          console.error('Failed to update vote', err);
          if (oldVote) {
            this.votes.update((votes) =>
              votes.map((v) => (v.id === voteId ? oldVote : v)),
            );
          }
          this.loading.set(false);
          this.snackBar?.open('Failed to update vote', 'Close', {
            duration: 3000,
          });
          return throwError(() => err);
        }),
      )
      .subscribe(() => {
        this.loading.set(false);
        this.snackBar?.open('Vote updated!', 'Close', { duration: 2000 });
      });
  }

  // ===== API CALLS - FAVORITES =====

  /** POST /favourites - Add to favorites */
  addToFavorites(imageId: string): void {
    const favData = {
      image_id: imageId,
      sub_id: 'angular-cat-explorer',
    };

    this.http
      .post<Favorite>(`${this.baseUrl}/favourites`, favData, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Failed to add favorite', err);
          this.error.set('Failed to add favorite');
          return of(null);
        }),
      )
      .subscribe((response) => {
        if (response) this.fetchFavorites();
      });
  }

  /** GET /favourites - Get favorites for your sub_id */
  fetchFavorites(): void {
    this.http
      .get<Favorite[]>(
        `${this.baseUrl}/favourites?sub_id=angular-cat-explorer`,
        {
          headers: this.getHeaders(),
        },
      )
      .pipe(
        catchError((err) => {
          console.error('Failed to load favorites', err);
          return of([]);
        }),
      )
      .subscribe((favorites) => {
        this.favorites.set(favorites);
        this.loadAllFavoriteImages();
      });
  }

  /** DELETE /favourites/{favourite_id} - Remove from favorites */
  deleteFromFavorites(favoriteId: number): void {
    const favToDelete = this.favorites().find((f) => f.id === favoriteId);
    if (!favToDelete) return;

    // Optimistic update
    this.favorites.update((favs) => favs.filter((f) => f.id !== favoriteId));

    const stillHasFavs = this.favorites().some(
      (f) => f.image_id === favToDelete.image_id,
    );
    if (!stillHasFavs) {
      this.favoriteImagesData.update((map) => {
        map.delete(favToDelete.image_id);
        return new Map(map);
      });
    }

    this.http
      .delete(`${this.baseUrl}/favourites/${favoriteId}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Failed to delete favorite', err);
          this.fetchFavorites(); // Revert on error
          this.snackBar?.open('Failed to delete favorite', 'Close', {
            duration: 3000,
          });
          return of(null);
        }),
      )
      .subscribe(() => {
        this.snackBar?.open('Removed from favorites', 'Close', {
          duration: 2000,
        });
      });
  }

  /** Alias for deleteFromFavorites */
  removeFromFavorites(favouriteId: number): void {
    this.deleteFromFavorites(favouriteId);
  }

  /** PUT /favourites/{favourite_id} - Update favorite note/category */
  updateFavorite(favouriteId: number, note: string, category?: string): void {
    const updateData: any = { note };
    if (category) updateData.category = category;

    this.http
      .put(`${this.baseUrl}/favourites/${favouriteId}`, updateData, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Failed to update favorite', err);
          this.error.set('Failed to update favorite');
          this.snackBar?.open('Failed to update favorite', 'Close', {
            duration: 3000,
          });
          return of(null);
        }),
      )
      .subscribe(() => {
        this.fetchFavorites();
        this.snackBar?.open('Favorite updated!', 'Close', { duration: 2000 });
      });
  }
}
