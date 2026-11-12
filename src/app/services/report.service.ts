import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportItem {
  id?: number;
  created_at?: string;
  title: string;
  category: string;
  location: string;
  finder_name: string;
  custody: 'surrendered' | 'with_finder';
  description: string;
  photo_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private http = inject(HttpClient);

  // Supabase REST endpoint for the 'reports' table
  private apiUrl = `${environment.supabaseUrl}/rest/v1/reports`;

  // Headers required by Supabase REST API
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      apikey: environment.supabaseKey,
      Authorization: `Bearer ${environment.supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation', // Returns the inserted row
    });
  }

  // ==========================================
  // 1. GET OPERATION (Reads feed data for Tab 1)
  // ==========================================
  async getReports(): Promise<ReportItem[]> {
    const url = `${this.apiUrl}?select=*&order=created_at.desc`;
    const response$ = this.http.get<ReportItem[]>(url, { headers: this.getHeaders() });
    return await firstValueFrom(response$);
  }

  // ==========================================
  // 2. POST OPERATION (Sends new report from Tab 2)
  // ==========================================
  async addReport(report: Omit<ReportItem, 'id' | 'created_at'>): Promise<ReportItem> {
    const response$ = this.http.post<ReportItem[]>(this.apiUrl, [report], {
      headers: this.getHeaders(),
    });
    const result = await firstValueFrom(response$);
    return result[0];
  }
}
