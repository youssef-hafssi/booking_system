import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const emailService = {
  /**
   * Test email configuration by sending a simple test email
   */
  testEmailConfig: async (testEmail = null) => {
    const params = testEmail ? { testEmail } : {};
    return await axios.post(`${API_URL}/email/test-config`, null, { params });
  },

  /**
   * Send test reminder emails to students with upcoming reservations
   */
  testStudentReminders: async () => {
    return await axios.post(`${API_URL}/email/test-student-reminders`);
  },

  /**
   * Check for reminders manually (admin only)
   */
  checkReminders: async () => {
    return await axios.post(`${API_URL}/email/check-reminders`);
  },

  /**
   * Send immediate reminder for specific reservation
   */
  testReservationReminder: async (reservationId) => {
    return await axios.post(`${API_URL}/email/test-reminder/${reservationId}`);
  }
}; 