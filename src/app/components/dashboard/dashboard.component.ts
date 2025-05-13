import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PaymentService } from '../../services/payment.service';
import { DateService } from '../../services/date.service';
import { PaymentPeriod, Payment } from '../../models/payment-period.model';
import { PaymentConcept } from '../../models/payment-concept.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  paymentPeriods$: Observable<PaymentPeriod[]>;
  paymentConcepts$: Observable<PaymentConcept[]>;
  currentPeriod: PaymentPeriod | null = null;
  totalConceptsCount = 0;
  
  constructor(
    private paymentService: PaymentService,
    private dateService: DateService,
    private router: Router
  ) {
    this.paymentPeriods$ = this.paymentService.getPaymentPeriods();
    this.paymentConcepts$ = this.paymentService.getPaymentConcepts();
  }
  
  ngOnInit(): void {
    this.paymentService.calculatePaymentsForAllPeriods();
    
    this.paymentPeriods$.subscribe(periods => {
      // Find the current period
      const today = new Date();
      this.currentPeriod = periods.find(period => 
        new Date(period.startDate) <= today && new Date(period.endDate) >= today
      ) || null;
    });
    
    this.paymentConcepts$.subscribe(concepts => {
      this.totalConceptsCount = concepts.length;
    });
  }
  
  formatDate(date: Date): string {
    return this.dateService.formatDate(new Date(date));
  }
  
  formatShortDate(date: Date): string {
    return this.dateService.formatShortDate(new Date(date));
  }
  
  calculatePeriodTotal(period: PaymentPeriod): number {
    return period.payments.reduce((total, payment) => total + payment.totalAmount, 0);
  }
  
  navigateToNewConcept(): void {
    this.router.navigate(['/payment-concept/new']);
  }
  
  navigateToConceptsList(): void {
    this.router.navigate(['/payment-concepts']);
  }
  
  navigateToConceptDetail(conceptId: string): void {
    this.router.navigate(['/payment-concept', conceptId]);
  }
  
  isPeriodActive(period: PaymentPeriod): boolean {
    const today = new Date();
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    
    return today >= startDate && today <= endDate;
  }
  
  getPeriodStatusClass(period: PaymentPeriod): string {
    if (this.isPeriodActive(period)) {
      return 'active-period';
    }
    
    const today = new Date();
    const endDate = new Date(period.endDate);
    
    return today > endDate ? 'past-period' : 'future-period';
  }
}
