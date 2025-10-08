// This file centralizes API calls for the application.
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Fetches the complete profile for a specific user by their email.
 * @param {string} email - The email of the user to fetch.
 * @returns {Promise<object>} - The user profile data.
 * @throws {Error} - Throws an error if the API call fails.
 */
export const fetchUserProfile = async (email) => {
  if (!email) {
    throw new Error('Email is required to fetch user profile.');
  }
  const response = await fetch(`${API_BASE_URL}/employees/email/${encodeURIComponent(email.trim())}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch user profile');
  }
  
  return response.json();
};

/**
 * Updates a user's profile details in the database.
 * @param {string} email - The email of the user to update.
 * @param {object} profileData - An object containing the fields to update (e.g., { phone: '123', date_of_birth: '2000-01-01' }).
 * @returns {Promise<object>} - The updated user profile data from the server.
 * @throws {Error} - Throws an error if the API call fails.
 */
export const updateUserProfile = async (email, profileData) => {
  if (!email) {
    throw new Error('Email is required to update user profile.');
  }
  
  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email.trim())}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update profile');
    } catch (e) {
      throw new Error(`Failed to update profile. Server responded with status: ${response.status}`);
    }
  }
  
  return response.json();
};

/**
 * Fetches the work details for all employees.
 * @returns {Promise<Array<object>>} - An array of all employee work details.
 * @throws {Error} - Throws an error if the API call fails.
 */
export const fetchEmployeesWorkDetails = async () => {
  const response = await fetch(`${API_BASE_URL}/employees/work-details/`); // Note the trailing slash
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch employee work details');
  }
  
  return response.json();
};

/**
 * Fetches the team members for a specific manager by their employee code.
 * @param {string} managerId - The employee code of the manager.
 * @returns {Promise<object>} - An object containing the manager's details and team list.
 * @throws {Error} - Throws an error if the API call fails.
 */
export const fetchManagerTeam = async (managerId) => {
  if (!managerId) {
    throw new Error('Manager ID is required to fetch the team.');
  }
  const response = await fetch(`${API_BASE_URL}/manager/${encodeURIComponent(managerId)}/team`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch manager team');
  }

  return response.json();
};

/**
 * Fetches the attendance report for a manager's team.
 * @param {object} params - The parameters for the report.
 * @param {string} params.managerId - The employee code of the manager.
 * @param {string} params.reportType - The type of report ('day' or 'month').
 * @param {Date} params.date - The selected date for the report.
 * @param {AbortSignal} [params.signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} - The attendance report data.
 * @throws {Error} - Throws an error if the API call fails.
 */
export const fetchManagerAttendanceReport = async ({ managerId, teamEmpCodes, reportType, date, signal }) => {
  if (!managerId) {
    throw new Error('Manager ID is required to fetch the attendance report.');
  }

  // The endpoint is now just /attendance-report/manager
  const url = `${API_BASE_URL}/attendance-report/manager`;

  // Prepare the request body
  const body = {
    manager_code: managerId,
    team_emp_codes: teamEmpCodes,
    view_type: reportType,
  };

  if (reportType === 'day') {
    body.date = date.toISOString().split('T')[0];
  } else { // month
    body.year = date.getFullYear();
    body.month = date.getMonth() + 1;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch manager attendance report');
  }

  return response.json();
};
