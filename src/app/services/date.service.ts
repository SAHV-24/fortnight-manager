import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  
  constructor() { }
  
  /**
   * Check if the provided year is a leap year
   */
  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }
  
  /**
   * Get the number of days in a month
   */
  getDaysInMonth(year: number, month: number): number {
    // month is 0-indexed (0 = January, 11 = December)
    return new Date(year, month + 1, 0).getDate();
  }
  
  /**
   * Format a date to a readable string
   */
  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }
  
  /**
   * Format a date to a short string (DD/MM/YYYY)
   */
  formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-ES');
  }
  
  /**
   * Get the start and end dates for the current bi-weekly period
   */
  getCurrentBiWeeklyPeriod(): { start: Date, end: Date } {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    
    let start: Date;
    let end: Date;
    
    if (day <= 5) {
      // First period: 1st to 5th
      start = new Date(year, month, 1);
      end = new Date(year, month, 5);
    } else if (day <= 20) {
      // Second period: 6th to 20th
      start = new Date(year, month, 6);
      end = new Date(year, month, 20);
    } else {
      // Third period: 21st to end of month
      start = new Date(year, month, 21);
      end = new Date(year, month + 1, 0); // Last day of current month
    }
    
    return { start, end };
  }
  
  /**
   * Get the next bi-weekly period
   */
  getNextBiWeeklyPeriod(currentEnd: Date): { start: Date, end: Date } {
    const nextDay = new Date(currentEnd);
    nextDay.setDate(nextDay.getDate() + 1);
    const day = nextDay.getDate();
    const month = nextDay.getMonth();
    const year = nextDay.getFullYear();
    
    let start: Date;
    let end: Date;
    
    if (day === 1) {
      // First period of next month: 1st to 5th
      start = new Date(year, month, 1);
      end = new Date(year, month, 5);
    } else if (day === 6) {
      // Second period: 6th to 20th
      start = new Date(year, month, 6);
      end = new Date(year, month, 20);
    } else {
      // Third period: 21st to end of month
      start = new Date(year, month, 21);
      end = new Date(year, month + 1, 0); // Last day of the month
    }
    
    return { start, end };
  }
  
  /**
   * Get an array of all bi-weekly periods in a year
   */
  getAllBiWeeklyPeriodsInYear(year: number): Array<{ start: Date, end: Date }> {
    const periods: Array<{ start: Date, end: Date }> = [];
    
    for (let month = 0; month < 12; month++) {
      // First period: 1st to 5th
      periods.push({
        start: new Date(year, month, 1),
        end: new Date(year, month, 5)
      });
      
      // Second period: 6th to 20th
      periods.push({
        start: new Date(year, month, 6),
        end: new Date(year, month, 20)
      });
      
      // Third period: 21st to end of month
      periods.push({
        start: new Date(year, month, 21),
        end: new Date(year, month + 1, 0)
      });
    }
    
    return periods;
  }
  
  /**
   * Get the day name in Spanish
   */
  getDayName(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }
  
  /**
   * Get the month name in Spanish
   */
  getMonthName(date: Date): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[date.getMonth()];
  }
}
