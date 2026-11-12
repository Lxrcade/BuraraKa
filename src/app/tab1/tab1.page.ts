import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular';
import { ReportService, ReportItem } from '../services/report.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    FormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class Tab1Page implements OnInit {
  private reportService = inject(ReportService);
  private router = inject(Router);

  public allItems: ReportItem[] = [];
  public filteredItems: ReportItem[] = [];
  public selectedCategory: string = 'all';
  public searchTerm: string = '';
  public statusMessage: string = 'Connecting to database...';

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/tabs/tab1') || event.url === '/') {
          this.loadItems();
        }
      });
  }

  async ngOnInit() {
    await this.loadItems();
  }

  async ionViewWillEnter() {
    await this.loadItems();
  }

  async loadItems() {
    try {
      this.statusMessage = 'Fetching reports from Supabase...';
      this.allItems = await this.reportService.getReports();
      this.filterItems();
    } catch (error: any) {
      console.error('Error loading reports:', error);
      this.statusMessage = `Database Error (${error?.status ?? 'Offline'}): ${error?.error?.message || error?.statusText || error?.message || 'Cannot reach Supabase'
        }`;
    }
  }

  async handleRefresh(event: any) {
    await this.loadItems();
    event.target.complete();
  }

  // 👈 Instantly captures keystroke without lag
  onSearchInput(event: any) {
    const rawVal = event?.target?.value ?? event?.detail?.value ?? '';
    this.searchTerm = rawVal.trim().toLowerCase();

    // If searching, auto-switch category to 'all' so results aren't blocked
    if (this.searchTerm && this.selectedCategory !== 'all') {
      this.selectedCategory = 'all';
    }

    this.filterItems();
  }

  // 👈 Clear button handler
  onSearchClear() {
    this.searchTerm = '';
    this.filterItems();
  }

  filterItems() {
    let items = [...this.allItems];
    const query = this.searchTerm;

    // 1. Filter by category
    if (this.selectedCategory && this.selectedCategory !== 'all') {
      items = items.filter(
        (item) => item.category?.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }

    // 2. Filter by search query
    if (query) {
      items = items.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const loc = (item.location || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const finder = (item.finder_name || '').toLowerCase();

        return (
          title.includes(query) ||
          loc.includes(query) ||
          desc.includes(query) ||
          cat.includes(query) ||
          finder.includes(query)
        );
      });
    }

    this.filteredItems = items;

    // 3. Status messages
    if (this.allItems.length === 0) {
      this.statusMessage = 'No reports found in database yet.';
    } else if (this.filteredItems.length === 0) {
      this.statusMessage = 'No items match your search.';
    } else {
      this.statusMessage = '';
    }
  }
}