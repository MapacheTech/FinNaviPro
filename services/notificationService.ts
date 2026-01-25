import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Debt } from '../types';

/**
 * Calculate the next payment date based on payment_due_day
 */
export const getNextPaymentDate = (paymentDueDay: number): Date => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let nextPaymentDate: Date;

  if (currentDay <= paymentDueDay) {
    // Payment is still due this month
    nextPaymentDate = new Date(currentYear, currentMonth, paymentDueDay);
  } else {
    // Payment is next month
    nextPaymentDate = new Date(currentYear, currentMonth + 1, paymentDueDay);
  }

  return nextPaymentDate;
};

/**
 * Get days until next payment
 */
export const getDaysUntilPayment = (paymentDueDay: number): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextPayment = getNextPaymentDate(paymentDueDay);
  nextPayment.setHours(0, 0, 0, 0);
  const diffTime = nextPayment.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format date for display
 */
export const formatPaymentDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'short' 
  };
  return date.toLocaleDateString('es-MX', options);
};

/**
 * Get upcoming payments sorted by date
 */
export const getUpcomingPayments = (debts: Debt[]): Array<Debt & { nextPaymentDate: Date; daysUntil: number }> => {
  return debts
    .filter(debt => debt.paymentDueDay) // Only debts with payment due day set
    .map(debt => ({
      ...debt,
      nextPaymentDate: getNextPaymentDate(debt.paymentDueDay!),
      daysUntil: getDaysUntilPayment(debt.paymentDueDay!),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
};

/**
 * Notification Service for Payment Reminders
 */
export const notificationService = {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  /**
   * Check if notifications are enabled
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  },

  /**
   * Schedule a payment reminder notification
   */
  async schedulePaymentReminder(
    debt: Debt,
    daysBeforePayment: number = 3
  ): Promise<void> {
    if (!debt.paymentDueDay) return;

    const nextPaymentDate = getNextPaymentDate(debt.paymentDueDay);
    const reminderDate = new Date(nextPaymentDate);
    reminderDate.setDate(reminderDate.getDate() - daysBeforePayment);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM

    // Don't schedule if reminder date is in the past
    if (reminderDate <= new Date()) return;

    const notificationId = parseInt(debt.id) * 10 + daysBeforePayment;

    const options: ScheduleOptions = {
      notifications: [
        {
          id: notificationId,
          title: `💳 Pago próximo: ${debt.name}`,
          body: daysBeforePayment === 0
            ? `¡Hoy vence el pago de $${debt.monthlyPayment || debt.minPayment}!`
            : `En ${daysBeforePayment} día${daysBeforePayment > 1 ? 's' : ''} vence el pago de $${debt.monthlyPayment || debt.minPayment}`,
          schedule: { at: reminderDate },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#13EC13',
        },
      ],
    };

    try {
      await LocalNotifications.schedule(options);
      console.log(`Scheduled reminder for ${debt.name} on ${reminderDate}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  },

  /**
   * Schedule all payment reminders for a list of debts
   */
  async scheduleAllReminders(debts: Debt[]): Promise<void> {
    // First cancel all existing reminders
    await this.cancelAllReminders();

    for (const debt of debts) {
      if (debt.paymentDueDay) {
        // Schedule reminders: 3 days before, 1 day before, and day of
        await this.schedulePaymentReminder(debt, 3);
        await this.schedulePaymentReminder(debt, 1);
        await this.schedulePaymentReminder(debt, 0);
      }
    }
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllReminders(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  },
};
