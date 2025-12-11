import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Character } from '../interfaces/charResponse';
import { Observable } from 'rxjs';


const API_URL = 'https://rickandmortyapi.com/api/'

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient)
  public charList = signal<Character>

  getAll(): Observable<{ results: Character[] }>{
    return this.http.get<{ results: Character[] }>(`${API_URL}/character`)
  }
}
