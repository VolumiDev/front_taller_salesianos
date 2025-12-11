import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../Services/UserService';

interface Credential {
  email: string,
  password: string
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private router = inject(Router)
  private userService = inject(UserService)

  credentials: Credential = {
    email: '',
    password: ''
  }

  emailOk: string = 'pepito@google.com'
  passwordOk: string = 'pepito'

  autenticate() {
    const { email } = this.credentials
    const storeKey: string = `user_${email.split('@')[0]}`

    if (this.credentials.email === this.emailOk && this.credentials.password === this.passwordOk) {

    }
    const userString = sessionStorage.getItem(storeKey)
    let userData: User | null = null
    if (userString) {
      try {
        userData = JSON.parse(userString) as User;

        console.log('Objeto de usuario recuperado y parseado:');
        console.log('Nombre:', userData.name);
        
        if(userData.email===this.credentials.email && userData.password===this.credentials.password){
          const tempUser:User ={
            name: userData.name,
            email: userData.email,
            password: userData.password
          } 
          this.userService.user = tempUser;
          this.router.navigate(['/home']); 

        }
        // Ejemplo de uso:

      } catch (error) {
        console.error('Error al parsear el JSON de sessionStorage:', error);
      }
    }



  }
}



