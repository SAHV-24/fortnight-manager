import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../services/payment.service';
import { PaymentConcept, DaysOfWeek } from '../../models/payment-concept.model';

@Component({
  selector: 'app-payment-concept-form',
  templateUrl: './payment-concept-form.component.html',
  styleUrls: ['./payment-concept-form.component.scss'],
  standalone: false
})
export class PaymentConceptFormComponent implements OnInit {
  conceptForm: FormGroup;
  isEditMode = false;
  conceptId: string | null = null;
  pageTitle = 'Nuevo Concepto de Pago';
  submitButtonText = 'Crear Concepto';
  
  daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.conceptForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: [''],
      dailyAmount: [0, [Validators.required, Validators.min(0)]],
      selectedDays: this.fb.group({
        monday: [false],
        tuesday: [false],
        wednesday: [false],
        thursday: [false],
        friday: [false],
        saturday: [false],
        sunday: [false]
      }),
      active: [true]
    });
  }
  
  ngOnInit(): void {
    this.conceptId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.conceptId;
    
    if (this.isEditMode) {
      this.pageTitle = 'Editar Concepto de Pago';
      this.submitButtonText = 'Actualizar Concepto';
      this.loadConceptData();
    }
  }
  
  loadConceptData(): void {
    if (!this.conceptId) return;
    
    this.paymentService.getPaymentConcept(this.conceptId).subscribe(
      concept => {
        if (concept) {
          // Cargar datos básicos
          this.conceptForm.patchValue({
            name: concept.name,
            description: concept.description || '',
            dailyAmount: concept.dailyAmount,
            active: concept.active
          });
          
          // Si hay días seleccionados, cargarlos
          if (concept.selectedDays) {
            this.conceptForm.get('selectedDays')?.patchValue(concept.selectedDays);
          }
        } else {
          this.showError('Concepto no encontrado');
          this.router.navigate(['/payment-concepts']);
        }
      },
      error => {
        this.showError('Error al cargar el concepto');
        console.error('Error loading concept:', error);
      }
    );
  }
  
  onSubmit(): void {
    if (this.conceptForm.invalid) {
      this.conceptForm.markAllAsTouched();
      return;
    }
    
    const formValue = this.conceptForm.value;
    
    if (this.isEditMode && this.conceptId) {
      this.paymentService.updatePaymentConcept(this.conceptId, formValue).subscribe(
        updatedConcept => {
          if (updatedConcept) {
            this.showSuccess('Concepto actualizado correctamente');
            this.router.navigate(['/payment-concepts']);
          } else {
            this.showError('Error al actualizar el concepto');
          }
        },
        error => {
          this.showError('Error al actualizar el concepto');
          console.error('Update error:', error);
        }
      );
    } else {
      this.paymentService.createPaymentConcept(formValue).subscribe(
        newConcept => {
          this.showSuccess('Concepto creado correctamente');
          this.router.navigate(['/payment-concepts']);
        },
        error => {
          this.showError('Error al crear el concepto');
          console.error('Create error:', error);
        }
      );
    }
  }
  
  onCancel(): void {
    this.router.navigate(['/payment-concepts']);
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
