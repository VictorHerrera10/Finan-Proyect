import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserToolbarComponent } from './components/user-toolbar/user-toolbar.component';
import { SimulatorComponent } from './components/simulator/simulator.component';
import { DataComponent } from './components/data/data.component';
import { ProfileComponent } from './components/profile/profile.component';

const routes: Routes = [
  {path: '',  redirectTo: '/', pathMatch: 'full'},
  {path: '', component: LoginComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: "simulator", component: SimulatorComponent},
  {path: "data", component: DataComponent},
  {path: "profile", component: ProfileComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
