import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService } from '../Services/UserService';
import { Character, Status } from '../interfaces/charResponse';
import { ApiService } from '../Services/apiService';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {

  private userService = inject(UserService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  
  user = this.userService.user

  // Estado con Signal: lista de personajes
  public characters = signal<Character[]>([]);
  public loading = signal<boolean>(true);
  public Status = Status; // Exportar enum para usarlo en el template

  ngOnInit(): void {
    this.fetchCharacters();
  }

  /**
   * Realiza la llamada HTTP y actualiza la Signal.
   */
  fetchCharacters(): void {
    this.loading.set(true);
    this.apiService.getAll().subscribe({
      next: (response) => {
        this.characters.set(response.results);
      },
      error: (err) => {
        console.error('Error al cargar personajes:', err);
        // Podrías poner un mensaje de error en otra Signal
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  /**
   * Cierra la sesión, limpia sessionStorage y redirige al login.
   */
  logout(): void {
    sessionStorage.clear(); // Limpia todos los datos temporales
    localStorage.clear();   // (Opcional) Limpia datos permanentes si los hubiera

    // Redirige al login
    this.router.navigate(['/login']);
  }

  /**
   * Clases de Tailwind basadas en el Status (paleta roja + colores base)
   */
  getStatusClass(status: Status): string {
    switch (status) {
      case Status.Alive:
        return 'text-green-700 bg-green-100'; // Verde base para Vivo
      case Status.Dead:
        return 'text-red-700 bg-red-100';    // Rojo de tu paleta para Muerto
      case Status.Unknown:
      default:
        return 'text-slate-700 bg-slate-100'; // Gris base para Desconocido
    }
  }

}
