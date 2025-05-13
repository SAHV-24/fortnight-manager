import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PaymentConceptFormComponent } from './components/payment-concept-form/payment-concept-form.component';
import { PaymentDetailComponent } from './components/payment-detail/payment-detail.component';
import { PaymentListComponent } from './components/payment-list/payment-list.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'payment-concepts', component: PaymentListComponent },
  { path: 'payment-concept/new', component: PaymentConceptFormComponent },
  { path: 'payment-concept/:id', component: PaymentDetailComponent },
  { path: 'payment-concept/edit/:id', component: PaymentConceptFormComponent },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
