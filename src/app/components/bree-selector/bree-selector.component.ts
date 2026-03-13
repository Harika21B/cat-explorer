import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CarServiceService } from '../../services/car-service.service';

/**
 * Breed Selector Component
 *
 * A dropdown selector that allows users to filter cats by breed.
 * Displays a list of all available cat breeds from The Cat API
 * and emits the selected breed ID to the parent component.
 *
 * Features:
 * - "All Breeds" option to show cats from all breeds
 * - Dynamic breed list loaded from the service
 * - Displays breed name with origin country in parentheses
 * - Emits selection changes to parent component
 */
@Component({
  selector: 'app-bree-selector',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './bree-selector.component.html',
  styleUrl: './bree-selector.component.scss',
})
export class BreeSelectorComponent {
  // ===== DEPENDENCY INJECTION =====
  protected catService = inject(CarServiceService);

  // ===== OUTPUTS =====
  /** Emits the selected breed ID to the parent component when selection changes */
  breedSelected = output<string>();

  // ===== STATE =====
  /**
   * Current selected breed ID from the service
   * Used to set the initial value of the dropdown
   * Note: Using bracket notation to access private property - consider making this public in service
   */
  selectedValue = this.catService['selectedBreedId']();

  onBreedSelected(value: string): void {
    this.breedSelected.emit(value);
  }
}
