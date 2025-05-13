import { PaymentConcept } from './payment-concept.model';

export interface PaymentPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  payments: Payment[];
}

export interface Payment {
  id: string;
  concept: PaymentConcept;
  totalAmount: number;
  periodId: string;
  daysCount: number;
}

export interface DayCount {
  date: Date;
  isWeekday: boolean;
  isWeekend: boolean;
}
