import React, { useState } from 'react';
import { emailService } from '../services/emailService';
import InteractiveHoverButton from './ui/InteractiveHoverButton';
import { HiOutlineMail, HiOutlineRefresh, HiOutlineUserGroup } from 'react-icons/hi';

const EmailTest = () => {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTestEmail = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await emailService.testEmailConfig(testEmail || null);
      setResult({
        type: 'success',
        message: response.data || 'Test email sent successfully!'
      });
    } catch (err) {
      setError(err.response?.data || 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckReminders = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await emailService.checkReminders();
      setResult({
        type: 'success',
        message: response.data || 'Reminder check completed successfully!'
      });
    } catch (err) {
      setError(err.response?.data || 'Failed to check reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleTestStudentReminders = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await emailService.testStudentReminders();
      setResult({
        type: 'success',
        message: response.data || 'Test reminders sent to students successfully!'
      });
    } catch (err) {
      setError(err.response?.data || 'Failed to send test student reminders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-sidebar rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <HiOutlineMail className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Configuration Test</h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test your email configuration to ensure reminder emails are working properly.
      </p>

      <div className="space-y-4">
        {/* Test Email Input */}
        <div>
          <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Email Address (optional)
          </label>
          <input
            type="email"
            id="testEmail"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Leave empty to send to configured email"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <InteractiveHoverButton
            onClick={handleTestEmail}
            disabled={loading}
            variant="primary"
            size="sm"
          >
            <HiOutlineMail className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send Test Email'}
          </InteractiveHoverButton>

          <InteractiveHoverButton
            onClick={handleTestStudentReminders}
            disabled={loading}
            variant="success"
            size="sm"
          >
            <HiOutlineUserGroup className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Test Student Reminders'}
          </InteractiveHoverButton>

          <InteractiveHoverButton
            onClick={handleCheckReminders}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            {loading ? 'Checking...' : 'Check Reminders'}
          </InteractiveHoverButton>
        </div>

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-md ${
            result.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
            <p className={`text-sm ${
              result.type === 'success' 
                ? 'text-green-800 dark:text-green-300' 
                : 'text-blue-800 dark:text-blue-300'
            }`}>
              ✅ {result.message}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-300">
              ❌ {error}
            </p>
          </div>
        )}


      </div>
    </div>
  );
};

export default EmailTest; 