import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { PaymentConcept, DaysOfWeek } from '../../models/payment-concept.model';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
  standalone: false
})
export class PaymentListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'dailyAmount', 'selectedDays', 'active', 'actions'];
  dataSource = new MatTableDataSource<PaymentConcept>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private paymentService: PaymentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }
  
  ngOnInit(): void {
    this.loadPaymentConcepts();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Custom sorting
    this.dataSource.sortingDataAccessor = (item: PaymentConcept, property: string): string | number => {
      switch (property) {
        case 'dailyAmount': return item.dailyAmount;
        case 'active': return item.active ? 1 : 0;
        case 'selectedDays': return this.getSelectedDaysCount(item.selectedDays);
        case 'name': return item.name || '';
        default: return '';
      }
    };
  }
  
  loadPaymentConcepts(): void {
    this.paymentService.getPaymentConcepts().subscribe(
      concepts => {
        this.dataSource.data = concepts;
      },
      error => {
        this.showError('Error al cargar los conceptos de pago');
        console.error('Error loading concepts:', error);
      }
    );
  }
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  editConcept(id: string): void {
    this.router.navigate(['/payment-concept/edit', id]);
  }
  
  viewConcept(id: string): void {
    this.router.navigate(['/payment-concept', id]);
  }
  
  deleteConcept(id: string): void {
    if (confirm('¿Está seguro que desea eliminar este concepto? Esta acción no se puede deshacer.')) {
      this.paymentService.deletePaymentConcept(id).subscribe(
        success => {
          if (success) {
            this.showSuccess('Concepto eliminado correctamente');
            this.loadPaymentConcepts();
          } else {
            this.showError('No se pudo eliminar el concepto');
          }
        },
        error => {
          this.showError('Error al eliminar el concepto');
          console.error('Delete error:', error);
        }
      );
    }
  }
  
  createNewConcept(): void {
    this.router.navigate(['/payment-concept/new']);
  }
  
  getFrequencyTypeLabel(days: DaysOfWeek | undefined): string {
    if (!days) return 'Ningún día seleccionado';
    
    const selectedDaysCount = Object.values(days).filter(value => value === true).length;
    
    if (selectedDaysCount === 0) {
      return 'Ningún día seleccionado';
    } else if (days.monday && days.tuesday && days.wednesday && days.thursday && days.friday && 
              !days.saturday && !days.sunday) {
      return 'Días de la semana';
    } else if (!days.monday && !days.tuesday && !days.wednesday && !days.thursday && !days.friday && 
              days.saturday && days.sunday) {
      return 'Fines de semana';
    } else {
      return 'Personalizado';
    }
  }
  
  getSelectedDaysCount(days: DaysOfWeek | undefined): number {
    if (!days) return 0;
    return Object.values(days).filter(value => value === true).length;
  }
  
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
  
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
