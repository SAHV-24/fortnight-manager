import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { DateService } from '../../services/date.service';
import { PaymentConcept, DaysOfWeek } from '../../models/payment-concept.model';
import { PaymentPeriod, DayCount } from '../../models/payment-period.model';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-payment-detail',
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss'],
  standalone: false
})
export class PaymentDetailComponent implements OnInit {
  paymentConcept: PaymentConcept | null = null;
  currentPeriod: PaymentPeriod | null = null;
  nextPeriod: PaymentPeriod | null = null;
  loading = true;
  error = false;
  
  calculatedDays: DayCount[] = [];
  currentPeriodDaysCount = 0;
  currentPeriodAmount = 0;
  nextPeriodDaysCount = 0;
  nextPeriodAmount = 0;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private dateService: DateService
  ) { }
  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = true;
      this.loading = false;
      return;
    }
    
    this.paymentService.getPaymentConcept(id).subscribe(
      concept => {
        if (!concept) {
          this.error = true;
          this.loading = false;
          return;
        }
        
        this.paymentConcept = concept;
        this.loadPeriodsData();
      },
      error => {
        this.error = true;
        this.loading = false;
        console.error('Error loading concept:', error);
      }
    );
  }
  
  loadPeriodsData(): void {
    // Get current and next payment periods
    this.paymentService.getPaymentPeriods().subscribe(
      periods => {
        if (periods.length === 0) {
          this.loading = false;
          return;
        }
        
        const today = new Date();
        
        // Find current period
        this.currentPeriod = periods.find(period => 
          new Date(period.startDate) <= today && new Date(period.endDate) >= today
        ) || periods[0];
        
        // Find next period
        const currentIndex = periods.findIndex(p => p.id === this.currentPeriod?.id);
        this.nextPeriod = currentIndex < periods.length - 1 ? periods[currentIndex + 1] : null;
        
        // Calculate days and amounts
        this.calculatePeriodDetails();
        this.loading = false;
      },
      error => {
        this.error = true;
        this.loading = false;
        console.error('Error loading periods:', error);
      }
    );
  }
  
  calculatePeriodDetails(): void {
    if (!this.paymentConcept || !this.currentPeriod) return;
    
    // Calculate current period details
    this.calculatedDays = this.paymentService.countApplicableDays(
      this.currentPeriod.startDate,
      this.currentPeriod.endDate,
      this.paymentConcept.selectedDays
    );
    
    this.currentPeriodDaysCount = this.calculatedDays.length;
    this.currentPeriodAmount = this.currentPeriodDaysCount * this.paymentConcept.dailyAmount;
    
    // Calculate next period details if available
    if (this.nextPeriod) {
      const nextPeriodDays = this.paymentService.countApplicableDays(
        this.nextPeriod.startDate,
        this.nextPeriod.endDate,
        this.paymentConcept.selectedDays
      );
      
      this.nextPeriodDaysCount = nextPeriodDays.length;
      this.nextPeriodAmount = this.nextPeriodDaysCount * this.paymentConcept.dailyAmount;
    }
  }
  
  formatDate(date: Date): string {
    return this.dateService.formatDate(new Date(date));
  }
  
  formatShortDate(date: Date): string {
    return this.dateService.formatShortDate(new Date(date));
  }
  
  getDayName(date: Date): string {
    return this.dateService.getDayName(new Date(date));
  }
  
  getFrequencyTypeLabel(days: DaysOfWeek | undefined): string {
    if (!days) return 'Ningún día seleccionado';
    
    const selectedDaysCount = Object.values(days).filter(value => value === true).length;
    
    if (selectedDaysCount === 0) {
      return 'Ningún día seleccionado';
    } else if (days.monday && days.tuesday && days.wednesday && days.thursday && days.friday && 
              !days.saturday && !days.sunday) {
      return 'Días de la semana (Lunes a Viernes)';
    } else if (!days.monday && !days.tuesday && !days.wednesday && !days.thursday && !days.friday && 
              days.saturday && days.sunday) {
      return 'Fines de semana (Sábado y Domingo)';
    } else {
      return 'Días específicos';
    }
  }
  
  getSelectedDaysLabel(days: DaysOfWeek | undefined): string {
    if (!days) return 'Ningún día seleccionado';
    
    const daysNames = [];
    if (days.monday) daysNames.push('Lunes');
    if (days.tuesday) daysNames.push('Martes');
    if (days.wednesday) daysNames.push('Miércoles');
    if (days.thursday) daysNames.push('Jueves');
    if (days.friday) daysNames.push('Viernes');
    if (days.saturday) daysNames.push('Sábado');
    if (days.sunday) daysNames.push('Domingo');
    
    return daysNames.length > 0 ? daysNames.join(', ') : 'Ningún día seleccionado';
  }
  
  editConcept(): void {
    if (this.paymentConcept) {
      this.router.navigate(['/payment-concept/edit', this.paymentConcept.id]);
    }
  }
  
  goBack(): void {
    this.router.navigate(['/payment-concepts']);
  }
}
