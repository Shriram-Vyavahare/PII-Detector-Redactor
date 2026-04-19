# Requirements Document: Simple User Authentication System

## Introduction

This document specifies requirements for implementing a simple user authentication system with registration and login functionality. The system will use MySQL database for credential storage with basic email validation. After successful login, users will be redirected to the main PII detection dashboard.

## Glossary

- **User**: An individual who registers and logs into the system to access PII detection features
- **MySQL_Database**: The relational database storing user credentials (email and password)
- **Registration_Form**: The frontend UI component for new user sign-up
- **Login_Form**: The frontend UI component for existing user authentication
- **Main_Application**: The PII detection dashboard with upload, detection, redaction, and AI chatbot features
- **Session_State**: Simple client-side state tracking whether user is logged in

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to register with my email and password, so that I can access the PII detection system.

#### Acceptance Criteria

1. WHEN a user navigates to the application, THE system SHALL display a registration page for new users
2. THE Registration_Form SHALL require a valid email address
3. THE Registration_Form SHALL require a password field
4. THE Registration_Form SHALL validate email format (basic format check: contains @ and domain)
5. WHEN the email is already registered, THE system SHALL display an error message "Email already exists"
6. WHEN registration is successful, THE system SHALL store the email and password in the MySQL_Database
7. WHEN registration is successful, THE system SHALL display a success message and redirect to the login page

### Requirement 2: MySQL Database Setup

**User Story:** As a developer, I want clear SQL commands to create the database and users table, so that I can set up the database in MySQL Workbench.

#### Acceptance Criteria

1. THE system SHALL provide SQL commands to create a database named `pii_detector_db`
2. THE system SHALL provide SQL commands to create a `users` table with columns:
   - `id` (INT, primary key, auto-increment)
   - `email` (VARCHAR(255), unique, not null)
   - `password` (VARCHAR(255), not null)
   - `created_at` (TIMESTAMP, default current timestamp)
3. THE SQL commands SHALL be ready to copy-paste into MySQL Workbench
4. THE system SHALL connect to MySQL using environment variables:
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### Requirement 3: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access the PII detection features.

#### Acceptance Criteria

1. THE Login_Form SHALL require an email address field
2. THE Login_Form SHALL require a password field
3. WHEN the user submits the login form, THE system SHALL query the MySQL_Database for matching email and password
4. WHEN the credentials do not match, THE system SHALL display an error message "Invalid email or password"
5. WHEN the credentials match, THE system SHALL redirect the user to the Main_Application dashboard
6. THE system SHALL store login state in browser localStorage to track logged-in status

### Requirement 4: Access Control

**User Story:** As a system owner, I want the main application accessible only after login, so that users must authenticate first.

#### Acceptance Criteria

1. WHEN an unauthenticated user tries to access the main dashboard, THE system SHALL redirect to the login page
2. WHEN a user successfully logs in, THE system SHALL redirect to the main dashboard
3. THE main dashboard SHALL display all existing features (upload, detection, redaction, AI chatbot)
4. THE system SHALL check localStorage for login state on page load

### Requirement 5: Logout Functionality

**User Story:** As a logged-in user, I want to log out of the system, so that I can end my session.

#### Acceptance Criteria

1. THE Main_Application SHALL display a "Logout" button in the top navigation bar
2. WHEN the user clicks logout, THE system SHALL clear the login state from localStorage
3. WHEN logout is successful, THE system SHALL redirect to the login page

### Requirement 6: Frontend UI Components

**User Story:** As a user, I want simple and intuitive login and registration forms, so that I can easily authenticate.

#### Acceptance Criteria

1. THE Registration_Form SHALL match the existing application theme (dark/light mode support)
2. THE Login_Form SHALL match the existing application theme (dark/light mode support)
3. THE Registration_Form SHALL include fields for: email, password, and a "Sign Up" button
4. THE Login_Form SHALL include fields for: email, password, and a "Log In" button
5. THE Login_Form SHALL include a link to the registration page: "Don't have an account? Sign up"
6. THE Registration_Form SHALL include a link to the login page: "Already have an account? Log in"
7. THE forms SHALL display error messages when validation fails
8. THE forms SHALL show a loading state during API requests

### Requirement 7: Backward Compatibility

**User Story:** As a system maintainer, I want all existing features to remain unchanged, so that authentication doesn't break anything.

#### Acceptance Criteria

1. THE PII detection logic SHALL remain unchanged
2. THE document redaction functionality SHALL remain unchanged
3. THE AI chatbot functionality SHALL remain unchanged
4. THE theme toggle (dark/light mode) SHALL remain functional
5. THE file upload and download features SHALL remain unchanged
6. THE existing UI layout and styling SHALL remain unchanged
7. WHEN authentication is added, ALL existing features SHALL work exactly as before after login

## MySQL Database Commands

The following SQL commands should be executed in MySQL Workbench to set up the database:

```sql
-- Step 1: Create the database
CREATE DATABASE IF NOT EXISTS pii_detector_db;

-- Step 2: Use the database
USE pii_detector_db;

-- Step 3: Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Verify the table was created
DESCRIBE users;
```

## Dependencies

- **MySQL**: Version 5.7 or higher
- **Node.js packages**: 
  - `mysql2` (MySQL client for Node.js)
- **Frontend**: React Router for navigation between login/register/dashboard

## Success Criteria

The authentication system implementation will be considered successful when:

1. Users can register with email and password
2. Email validation prevents invalid email formats
3. Duplicate email registration is prevented
4. Credentials are stored in MySQL database
5. Users can log in with registered credentials
6. Successful login redirects to the main PII detection dashboard
7. Users can log out and are redirected to login page
8. Login state persists across page refreshes using localStorage
9. Existing PII detection functionality remains unchanged and fully operational
10. UI matches existing theme (dark/light mode)
