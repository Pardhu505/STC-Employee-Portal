# Profile Tab Update Task

## Objective
Update the profile tab to display:
- Department: User's department
- Sub-department: User's team
- Reviewer: Reporting manager of that team
- For reporting manager: Reviewer should be director members

## Steps
1. Modify profile.js to fetch user data from backend API using employeeAPI.getEmployeeByEmail
2. Fetch all employees using employeeAPI.getAllEmployees to find reporting managers and directors
3. Compute the correct reviewer based on the user's team
4. Update the profile display to show the computed reviewer
5. Handle loading states and errors for API calls

## Files to Edit
- frontend/src/components/profile.js

## Followup
- Test the profile tab to ensure correct data display
- Verify API calls work correctly
