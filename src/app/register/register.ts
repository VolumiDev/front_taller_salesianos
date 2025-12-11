import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule,RouterModule],
  templateUrl: './register.html',
})
export class Register {
  private router = inject(Router)


  newUser = {
    name: '',
    email: '',
    password: ''
  };

  register(): void {
    const { name, email, password } = this.newUser;
    
    // 2. Definir una clave única para almacenar el usuario (usando el email como identificador).
    const storageKey = `user_${email.split('@')[0]}`;
    
    const userJson = JSON.stringify(this.newUser);
    
    try {
      sessionStorage.setItem(storageKey, userJson);
      
      console.log('Nuevo usuario almacenado en sessionStorage:', this.newUser);
      console.log('Clave utilizada:', storageKey);

      this.router.navigate(['/login']);

    } catch (error) {
      console.error('Error al almacenar en sessionStorage. Asegúrate de que el navegador lo permite.', error);
    }



  }
}
