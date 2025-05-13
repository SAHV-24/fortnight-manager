export interface DaysOfWeek {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface PaymentConcept {
  id: string;
  name: string;
  description?: string;
  dailyAmount: number;
  selectedDays: DaysOfWeek;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
