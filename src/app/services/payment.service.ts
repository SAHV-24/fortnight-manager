import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

import { PaymentConcept, DaysOfWeek } from "../models/payment-concept.model";
import {
  PaymentPeriod,
  Payment,
  DayCount,
} from "../models/payment-period.model";
import { DateService } from "./date.service";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class PaymentService {
  private paymentConcepts = new BehaviorSubject<PaymentConcept[]>([]);
  private paymentPeriods = new BehaviorSubject<PaymentPeriod[]>([]);

  // This will be used when connecting to a real API
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private dateService: DateService) {
    this.loadInitialData();
  }

  /**
   * Initial data load - will be replaced with API calls later
   */
  private loadInitialData(): void {
    // Example payment concepts (for now using local storage, will be API later)
    const storedConcepts = localStorage.getItem("paymentConcepts");
    if (storedConcepts) {
      const concepts: PaymentConcept[] = JSON.parse(storedConcepts);
      this.paymentConcepts.next(concepts);
    }

    // Generate current and next payment periods
    this.generatePaymentPeriods();
  }

  /**
   * Generate payment periods for the current month and next month
   */
  private generatePaymentPeriods(): void {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const periods: PaymentPeriod[] = [];

    // First period: 5th of the current month to the 19th of the current month
    periods.push(
      this.createPeriod(
        new Date(currentYear, currentMonth, 5),
        new Date(currentYear, currentMonth, 19)
      )
    );

    // Second period: 20th of the current month to the 4th of the next month
    periods.push(
      this.createPeriod(
        new Date(currentYear, currentMonth, 20),
        new Date(currentYear, currentMonth + 1, 4)
      )
    );

    this.paymentPeriods.next(periods);
  }

  /**
   * Create a payment period with calculated payments
   */
  private createPeriod(startDate: Date, endDate: Date): PaymentPeriod {
    return {
      id: uuidv4(),
      startDate,
      endDate,
      payments: [],
    };
  }

  /**
   * Get all payment concepts
   */
  getPaymentConcepts(): Observable<PaymentConcept[]> {
    return this.paymentConcepts.asObservable();
  }

  /**
   * Get a specific payment concept by ID
   */
  getPaymentConcept(id: string): Observable<PaymentConcept | undefined> {
    return this.paymentConcepts.pipe(
      map((concepts) => concepts.find((concept) => concept.id === id))
    );
  }

  /**
   * Create a new payment concept
   */
  createPaymentConcept(
    concept: Omit<PaymentConcept, "id" | "createdAt" | "updatedAt">
  ): Observable<PaymentConcept> {
    const newConcept: PaymentConcept = {
      ...concept,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentConcepts = this.paymentConcepts.getValue();
    const updatedConcepts = [...currentConcepts, newConcept];

    this.paymentConcepts.next(updatedConcepts);
    this.saveToLocalStorage();
    this.calculatePaymentsForAllPeriods();

    return of(newConcept);
  }

  /**
   * Update an existing payment concept
   */
  updatePaymentConcept(
    id: string,
    concept: Partial<PaymentConcept>
  ): Observable<PaymentConcept | undefined> {
    const currentConcepts = this.paymentConcepts.getValue();
    const conceptIndex = currentConcepts.findIndex((c) => c.id === id);

    if (conceptIndex === -1) {
      return of(undefined);
    }

    const updatedConcept: PaymentConcept = {
      ...currentConcepts[conceptIndex],
      ...concept,
      updatedAt: new Date(),
    };

    const updatedConcepts = [...currentConcepts];
    updatedConcepts[conceptIndex] = updatedConcept;

    this.paymentConcepts.next(updatedConcepts);
    this.saveToLocalStorage();
    this.calculatePaymentsForAllPeriods();

    return of(updatedConcept);
  }

  /**
   * Delete a payment concept
   */
  deletePaymentConcept(id: string): Observable<boolean> {
    const currentConcepts = this.paymentConcepts.getValue();
    const updatedConcepts = currentConcepts.filter((c) => c.id !== id);

    if (updatedConcepts.length === currentConcepts.length) {
      return of(false);
    }

    this.paymentConcepts.next(updatedConcepts);
    this.saveToLocalStorage();
    this.calculatePaymentsForAllPeriods();

    return of(true);
  }

  /**
   * Get all payment periods
   */
  getPaymentPeriods(): Observable<PaymentPeriod[]> {
    return this.paymentPeriods.asObservable();
  }

  /**
   * Get a specific payment period
   */
  getPaymentPeriod(id: string): Observable<PaymentPeriod | undefined> {
    return this.paymentPeriods.pipe(
      map((periods) => periods.find((period) => period.id === id))
    );
  }

  /**
   * Calculate payments for all payment periods
   */
  calculatePaymentsForAllPeriods(): void {
    const periods = this.paymentPeriods.getValue();
    const concepts = this.paymentConcepts.getValue();

    const updatedPeriods = periods.map((period) => {
      const payments = concepts
        .filter((concept) => concept.active)
        .map((concept) =>
          this.calculatePaymentForConcept(
            concept,
            period.startDate,
            period.endDate
          )
        );

      return {
        ...period,
        payments,
      };
    });

    this.paymentPeriods.next(updatedPeriods);
  }

  /**
   * Calculate payment for a specific concept within a date range
   */
  calculatePaymentForConcept(
    concept: PaymentConcept,
    startDate: Date,
    endDate: Date
  ): Payment {
    // Count applicable days based on selected days
    const days = this.countApplicableDays(
      startDate,
      endDate,
      concept.selectedDays
    );

    // Calculate total amount
    const totalAmount = days.length * concept.dailyAmount;

    return {
      id: uuidv4(),
      concept,
      totalAmount,
      periodId: "", // Will be set when added to a period
      daysCount: days.length,
    };
  }

  /**
   * Count days that match the selected days within a date range
   */
  countApplicableDays(
    startDate: Date,
    endDate: Date,
    selectedDays: DaysOfWeek
  ): DayCount[] {
    const days: DayCount[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set to beginning of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1-6 for Monday-Saturday
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

      let shouldInclude = false;

      // Check if the current day is selected
      switch (dayOfWeek) {
        case 1:
          shouldInclude = selectedDays.monday;
          break;
        case 2:
          shouldInclude = selectedDays.tuesday;
          break;
        case 3:
          shouldInclude = selectedDays.wednesday;
          break;
        case 4:
          shouldInclude = selectedDays.thursday;
          break;
        case 5:
          shouldInclude = selectedDays.friday;
          break;
        case 6:
          shouldInclude = selectedDays.saturday;
          break;
        case 0:
          shouldInclude = selectedDays.sunday;
          break;
      }

      if (shouldInclude) {
        days.push({
          date: new Date(currentDate),
          isWeekday,
          isWeekend,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  /**
   * Calculate total for a payment period
   */
  calculatePeriodTotal(periodId: string): Observable<number> {
    return this.getPaymentPeriod(periodId).pipe(
      map((period) => {
        if (!period) return 0;
        return period.payments.reduce(
          (total, payment) => total + payment.totalAmount,
          0
        );
      })
    );
  }

  /**
   * Save data to local storage (temporary solution until API is connected)
   */
  private saveToLocalStorage(): void {
    localStorage.setItem(
      "paymentConcepts",
      JSON.stringify(this.paymentConcepts.getValue())
    );
  }
}
