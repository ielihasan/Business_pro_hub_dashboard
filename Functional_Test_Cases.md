# Functional Test Cases — Business Pro Hub Dashboard
**Project:** Business Pro Hub Dashboard
**Prepared By:** QA Team
**Date:** 2026-03-11
**Version:** 1.1 — Live Test Results Added

---

## Table of Contents
1. [Landing Page](#1-landing-page)
2. [Login Page](#2-login-page)
3. [Registration Page](#3-registration-page)
4. [Business Dashboard](#4-business-dashboard)
5. [Queue Management Page](#5-queue-management-page)
6. [Customers Page](#6-customers-page)
7. [Staff Management Page](#7-staff-management-page)
8. [Services Page](#8-services-page)
9. [Business Hours Page](#9-business-hours-page)
10. [Settings Page](#10-settings-page)
11. [Pricing & Plans Page](#11-pricing--plans-page)
12. [Orders Page](#12-orders-page)

---

## Legend

| Column | Description |
|---|---|
| TC ID | Unique test case identifier |
| Category | Form Validation / Links & Navigation / Functionality |
| Priority | High / Medium / Low |
| Status | Pass / Fail / Blocked / Not Executed |

**Test Environment:**
- Frontend: `http://localhost:3003` (Next.js 16.1.6, Turbopack)
- Backend: `http://localhost:8181` (Spring Boot 1.0.0-SNAPSHOT)
- Credentials: `business@test.com / Test@1234` (Business Owner), `admin@test.com / Admin@1234` (Admin)
- Tested: 2026-03-11

---

## 1. Landing Page

### 1.1 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| LP-LN-01 | Verify page title is descriptive and visible | 1. Open the application root URL `/` | Page title "Transform Your Customer Experience" is visible in the hero section | High | Pass |
| LP-LN-02 | Verify browser tab title is set | 1. Open `/` and check the browser tab | Browser tab displays a descriptive title (e.g., "Business Pro Hub") | Medium | Pass |
| LP-LN-03 | Verify "Sign In" link navigates to Login page | 1. Open `/`<br>2. Click the "Sign In" button/link in the header | User is redirected to `/auth/v1/login` | High | Pass |
| LP-LN-04 | Verify "Get Started Free" CTA navigates to Register page | 1. Open `/`<br>2. Click the "Get Started Free" button | User is redirected to `/auth/v1/register` | High | Pass |
| LP-LN-05 | Verify "Features" nav link scrolls to features section | 1. Open `/`<br>2. Click "Features" in the navigation bar | Page smoothly scrolls to the `#features` section without navigation to a new page | Medium | Pass |
| LP-LN-06 | Verify "Testimonials" nav link scrolls to testimonials section | 1. Open `/`<br>2. Click "Testimonials" in the navigation bar | Page smoothly scrolls to the `#testimonials` section | Medium | Pass |
| LP-LN-07 | Verify "Pricing" nav link scrolls to pricing section | 1. Open `/`<br>2. Click "Pricing" in the navigation bar | Page smoothly scrolls to the `#pricing` section | Medium | Pass |
| LP-LN-08 | Verify website logo redirects to homepage from any page | 1. Navigate to any secondary page (e.g., `/auth/v1/login`)<br>2. Click the logo/brand name in the top-left | User is redirected to the landing page `/` | High | **Fail** |
| LP-LN-09 | Verify "Demo Video" button opens a modal | 1. Open `/`<br>2. Click the "Demo Video" button | A modal dialog opens and plays/shows the demo video; background is darkened | Medium | Pass |
| LP-LN-10 | Verify Demo Video modal can be closed | 1. Open the Demo Video modal<br>2. Click the close button (✕) | Modal closes and user remains on the landing page | Medium | Pass |
| LP-LN-11 | Verify all footer links are functional and not broken | 1. Open `/`<br>2. Click each link in the footer (Company, Support, Legal sections) | Each link navigates to the correct destination or shows a valid page without a 404 error | Medium | Pass |
| LP-LN-12 | Verify "Upgrade Now" pricing buttons on landing page navigate to register | 1. Open `/`<br>2. Scroll to the pricing section<br>3. Click any "Upgrade Now" or "Get Started" button | User is redirected to `/auth/v1/register` | High | Pass |
| LP-LN-13 | Verify all internal navigation links have no broken anchors | 1. Open `/`<br>2. Click each nav item: Features, Testimonials, Pricing | All anchor links scroll to the correct section; no 404 or blank page | High | Pass |

---

## 2. Login Page

### 2.1 Form Validation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| LG-FV-01 | Verify mandatory fields are marked with an asterisk (*) | 1. Open `/auth/v1/login`<br>2. Inspect the Email and Password field labels | Both Email and Password fields are marked as required (asterisk `*` or "required" indicator visible) | High | **Fail** |
| LG-FV-02 | Verify submitting the form with all valid credentials saves session and redirects | 1. Open `/auth/v1/login`<br>2. Enter a valid registered email (e.g., `business@test.com`)<br>3. Enter the correct password<br>4. Click "Sign In" | User is authenticated, session is established, and user is redirected to the appropriate dashboard (e.g., `/business/dashboard`) | High | Pass |
| LG-FV-03 | Verify submitting the form with empty Email field shows an error | 1. Open `/auth/v1/login`<br>2. Leave the Email field blank<br>3. Enter any password<br>4. Click "Sign In" | An error message appears below the Email field (e.g., "Email is required" or "Invalid email") in the correct position | High | Pass |
| LG-FV-04 | Verify submitting the form with empty Password field shows an error | 1. Open `/auth/v1/login`<br>2. Enter a valid email<br>3. Leave the Password field blank<br>4. Click "Sign In" | An error message appears below the Password field (e.g., "Password is required" or "Minimum 6 characters") | High | Pass |
| LG-FV-05 | Verify submitting the form with both fields empty shows errors | 1. Open `/auth/v1/login`<br>2. Leave both Email and Password blank<br>3. Click "Sign In" | Error messages appear below both the Email field and Password field simultaneously | High | Pass |
| LG-FV-06 | Verify invalid email format shows a validation error | 1. Open `/auth/v1/login`<br>2. Enter an invalid email (e.g., `userexample.com` or `user@`) in the Email field<br>3. Click "Sign In" | An error message appears below the Email field indicating an invalid email format | High | Pass |
| LG-FV-07 | Verify password shorter than 6 characters shows a validation error | 1. Open `/auth/v1/login`<br>2. Enter a valid email<br>3. Enter a password with fewer than 6 characters (e.g., `abc`)<br>4. Click "Sign In" | An error message appears below the Password field indicating the minimum character requirement | High | Pass |
| LG-FV-08 | Verify incorrect credentials show an appropriate error message | 1. Open `/auth/v1/login`<br>2. Enter a valid email with a wrong password<br>3. Click "Sign In" | An error message is displayed (e.g., "Invalid credentials" or "Incorrect email or password") without crashing | High | Pass |
| LG-FV-09 | Verify the "Remember me" checkbox is optional | 1. Open `/auth/v1/login`<br>2. Login without checking "Remember me" | Login succeeds without any error; the checkbox is not required | Medium | Pass |
| LG-FV-10 | Verify the Email field does not accept non-email character input as valid | 1. Open `/auth/v1/login`<br>2. Enter purely numeric text (e.g., `1234567890`) in the Email field<br>3. Click "Sign In" | A validation error message appears indicating the email format is incorrect | High | Pass |
| LG-FV-11 | Verify password field masks characters by default | 1. Open `/auth/v1/login`<br>2. Enter text into the Password field | Characters are displayed as dots/asterisks (masked) by default | Medium | Pass |
| LG-FV-12 | Verify error messages appear in the correct position (below the respective field) | 1. Trigger validation errors on Email and Password fields | Each error message appears directly below its respective input field, not above it or in a generic banner elsewhere | High | Pass |

### 2.2 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| LG-LN-01 | Verify Login page has a clear and descriptive title | 1. Open `/auth/v1/login` | The page heading "Welcome to BusinessHub Pro" or equivalent descriptive title is clearly visible | High | Pass |
| LG-LN-02 | Verify browser tab title is set on Login page | 1. Open `/auth/v1/login`<br>2. Check the browser tab | Browser tab shows a descriptive title | Medium | Pass |
| LG-LN-03 | Verify "Register" link on Login page navigates to Registration page | 1. Open `/auth/v1/login`<br>2. Click the "Register" or "Sign up" link | User is redirected to `/auth/v1/register` | High | Pass |
| LG-LN-04 | Verify "Sign in with Google" button initiates OAuth flow | 1. Open `/auth/v1/login`<br>2. Click "Sign in with Google" | Browser redirects to Google's OAuth consent page or the Supabase OAuth callback page | Medium | Pass |
| LG-LN-05 | Verify logo on Login page navigates back to homepage | 1. Open `/auth/v1/login`<br>2. Click the logo or brand name | User is redirected to the landing page `/` | High | **Fail** |

---

## 3. Registration Page

### 3.1 Form Validation — Business Owner Tab

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| RG-FV-01 | Verify all mandatory fields in Business Owner form are marked with asterisk (*) | 1. Open `/auth/v1/register`<br>2. Ensure the "Business Owner" tab is active<br>3. Inspect the form labels | Mandatory fields (Full Name, Email, Password, Confirm Password, Business Name, Business Type, Business Phone, Business Address) are all marked with `*` | High | **Fail** |
| RG-FV-02 | Verify successful form submission with valid data creates an account | 1. Open `/auth/v1/register`<br>2. Select "Business Owner" tab<br>3. Fill all required fields with valid data<br>4. Click "Create Account" | User account is created, data is saved to the database, and user is redirected to `/auth/verify-email-pending` | High | Not Executed |
| RG-FV-03 | Verify submitting with all mandatory fields empty shows errors | 1. Open `/auth/v1/register`<br>2. Click "Create Account" without filling any field | Error messages appear below each mandatory empty field simultaneously | High | Pass |
| RG-FV-04 | Verify Full Name field with less than 2 characters shows an error | 1. Open `/auth/v1/register`<br>2. Enter a single character (e.g., `A`) in the Full Name field<br>3. Click "Create Account" | An error appears below the Full Name field (e.g., "Minimum 2 characters required") | High | Pass |
| RG-FV-05 | Verify invalid email format in Email field shows a validation error | 1. Open `/auth/v1/register`<br>2. Enter `invalidemail` in the Email field<br>3. Click "Create Account" | An error appears below the Email field indicating invalid format | High | Pass |
| RG-FV-06 | Verify Password field with less than 6 characters shows a validation error | 1. Open `/auth/v1/register`<br>2. Enter `abc12` (5 chars) in the Password field<br>3. Click "Create Account" | An error appears below the Password field (e.g., "Minimum 6 characters") | High | Pass |
| RG-FV-07 | Verify Confirm Password mismatch shows a validation error | 1. Open `/auth/v1/register`<br>2. Enter `password123` in Password<br>3. Enter `password456` in Confirm Password<br>4. Click "Create Account" | An error appears below the Confirm Password field (e.g., "Passwords do not match") | High | Pass |
| RG-FV-08 | Verify Business Name with less than 2 characters shows an error | 1. Open `/auth/v1/register`<br>2. Enter a single character (e.g., `A`) in Business Name<br>3. Click "Create Account" | An error appears below the Business Name field | High | Pass |
| RG-FV-09 | Verify Business Type is required and shows an error if not selected | 1. Open `/auth/v1/register`<br>2. Leave Business Type unselected<br>3. Click "Create Account" | An error appears below the Business Type field | High | Pass |
| RG-FV-10 | Verify Business Phone with less than 10 characters shows an error | 1. Open `/auth/v1/register`<br>2. Enter `123456789` (9 chars) in Business Phone<br>3. Click "Create Account" | An error appears below the Business Phone field (e.g., "Minimum 10 characters") | High | Pass |
| RG-FV-11 | Verify Business Address with less than 5 characters shows an error | 1. Open `/auth/v1/register`<br>2. Enter `Abc` (3 chars) in Business Address<br>3. Click "Create Account" | An error appears below the Business Address field | High | Pass |
| RG-FV-12 | Verify Business Description is optional and form submits without it | 1. Open `/auth/v1/register`<br>2. Fill all required fields correctly<br>3. Leave Business Description blank<br>4. Click "Create Account" | Form submits successfully; no error for the Description field | Medium | Pass |
| RG-FV-13 | Verify "Other" business type selection reveals a custom text input | 1. Open `/auth/v1/register`<br>2. Select "Other" from the Business Type dropdown | A text input field appears allowing the user to enter a custom business type | Medium | **Fail** |
| RG-FV-14 | Verify duplicate email registration shows an appropriate error | 1. Open `/auth/v1/register`<br>2. Enter an email already registered (e.g., `business@test.com`)<br>3. Fill other fields and submit | An error message is displayed (e.g., "Email already in use" or "User already registered") | High | Not Executed |
| RG-FV-15 | Verify Business Phone field rejects non-numeric inputs with a validation message | 1. Open `/auth/v1/register`<br>2. Enter alphabetic characters (e.g., `abcdefghij`) in Business Phone<br>3. Click "Create Account" | A validation error is shown indicating the field requires a valid phone number | High | Not Executed |
| RG-FV-16 | Verify error messages appear directly below the respective input fields | 1. Trigger validation errors on multiple fields | Each error message is displayed directly below its own input field, not at the top or in a separate modal | High | Pass |

### 3.2 Form Validation — Admin Tab

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| RG-FV-17 | Verify mandatory fields in Admin form are marked with asterisk (*) | 1. Open `/auth/v1/register`<br>2. Click the "Admin" tab<br>3. Inspect the form labels | Full Name, Email, Password, and Confirm Password fields are marked with `*` | High | **Fail** |
| RG-FV-18 | Verify Admin form submits successfully with valid data | 1. Open `/auth/v1/register`<br>2. Select "Admin" tab<br>3. Fill all required fields with valid unique data<br>4. Click "Create Account" | Account is created and user is redirected to verify email page | High | Not Executed |
| RG-FV-19 | Verify Admin form shows errors when submitted empty | 1. Open `/auth/v1/register`<br>2. Select "Admin" tab<br>3. Click "Create Account" without filling any field | Error messages appear below each mandatory empty field | High | Pass |
| RG-FV-20 | Verify Admin password mismatch shows a validation error | 1. Open `/auth/v1/register`<br>2. Select "Admin" tab<br>3. Enter different values in Password and Confirm Password<br>4. Click "Create Account" | Error appears below Confirm Password field | High | Pass |

### 3.3 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| RG-LN-01 | Verify Registration page has a clear and descriptive title | 1. Open `/auth/v1/register` | Heading "Create Your Account" or "Welcome to BusinessHub Pro" is clearly visible | High | Pass |
| RG-LN-02 | Verify "Login" link on Registration page navigates to Login page | 1. Open `/auth/v1/register`<br>2. Click the "Login" or "Already have an account?" link | User is redirected to `/auth/v1/login` | High | Pass |
| RG-LN-03 | Verify "Sign up with Google" button initiates OAuth flow | 1. Open `/auth/v1/register`<br>2. Click "Sign up with Google" | Browser redirects to Google's OAuth consent page | Medium | Pass |
| RG-LN-04 | Verify logo on Registration page navigates back to homepage | 1. Open `/auth/v1/register`<br>2. Click the logo or brand name | User is redirected to the landing page `/` | High | **Fail** |
| RG-LN-05 | Verify tab switching between Business Owner and Admin is functional | 1. Open `/auth/v1/register`<br>2. Click "Admin" tab | Form changes to show only Admin fields (Name, Email, Password, Confirm Password); Business fields are hidden | High | Pass |

---

## 4. Business Dashboard

### 4.1 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| BD-LN-01 | Verify Business Dashboard has a clear and descriptive page title | 1. Log in as a business owner<br>2. Navigate to `/business/dashboard` | Heading "Business Dashboard" is clearly visible on the page | High | Pass |
| BD-LN-02 | Verify sidebar link "Queue Management" navigates to the correct page | 1. From the Business Dashboard<br>2. Click "Queue Management" in the sidebar | User is redirected to `/business/queue` | High | Pass |
| BD-LN-03 | Verify sidebar link "Customers" navigates to the correct page | 1. From the Business Dashboard<br>2. Click "Customers" in the sidebar | User is redirected to `/business/customers` | High | Pass |
| BD-LN-04 | Verify sidebar link "Staff" navigates to the correct page | 1. From the Business Dashboard<br>2. Click "Staff" in the sidebar | User is redirected to `/business/staff` | High | Pass |
| BD-LN-05 | Verify sidebar link "Services" navigates to the correct page | 1. From the Business Dashboard<br>2. Click "Services" in the sidebar | User is redirected to `/business/services` | High | Pass |
| BD-LN-06 | Verify sidebar link "Business Hours" navigates to the correct page | 1. From the Business Dashboard<br>2. Click "Business Hours" in the sidebar | User is redirected to `/business/hours` | High | Pass |
| BD-LN-07 | Verify sidebar link "Pricing & Plans" navigates to the correct page | 1. From the Business Dashboard<br>2. Click "Pricing & Plans" in the sidebar | User is redirected to `/business/pricing` | High | Pass |
| BD-LN-08 | Verify sidebar link "Settings" navigates to the correct page | 1. From the Business Dashboard<br>2. Click "Settings" in the sidebar | User is redirected to `/business/settings` | High | Pass |
| BD-LN-09 | Verify all quick action buttons on the dashboard navigate to correct pages | 1. Log in as a business owner<br>2. From the dashboard, click each Quick Action button (Manage Queue, View Customers, etc.) | Each button redirects to the corresponding page | Medium | Pass |
| BD-LN-10 | Verify dashboard displays real data (not empty or broken) | 1. Log in as a business owner<br>2. Navigate to `/business/dashboard` | Metric cards (Active Queues, Pending Orders, Total Customers, Average Rating) are visible and display numeric values | High | Pass |

---

## 5. Queue Management Page

### 5.1 Form Validation — Create Queue Lane

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| QM-FV-01 | Verify mandatory fields in Create Queue Lane form are marked with asterisk (*) | 1. Navigate to `/business/queue`<br>2. Click the button to create a new Queue Lane/Type<br>3. Inspect field labels | The "Name" field is marked as required (`*`) | High | Blocked |
| QM-FV-02 | Verify submitting Create Lane form with valid data adds a new lane | 1. Navigate to `/business/queue`<br>2. Open the Create Lane dialog<br>3. Enter a valid name and estimated time<br>4. Click Save/Submit | A new queue lane card appears on the page and data is saved to the database | High | Blocked |
| QM-FV-03 | Verify submitting Create Lane form with empty Name field shows an error | 1. Navigate to `/business/queue`<br>2. Open the Create Lane dialog<br>3. Leave the Name field empty<br>4. Click Save/Submit | An error message appears below the Name field | High | Blocked |
| QM-FV-04 | Verify estimated time field rejects non-numeric (alphabetic) input | 1. Open the Create Lane dialog<br>2. Enter alphabetic characters (e.g., `abc`) into the Estimated Time field<br>3. Click Save/Submit | A validation error is shown, or the field does not accept non-numeric characters | High | Blocked |
| QM-FV-05 | Verify estimated time field does not accept a value below the minimum (< 1 min) | 1. Open the Create Lane dialog<br>2. Enter `0` or a negative number in Estimated Time<br>3. Click Save/Submit | An error message or browser validation prevents submission | Medium | Blocked |
| QM-FV-06 | Verify estimated time field does not accept a value above the maximum (> 300 min) | 1. Open the Create Lane dialog<br>2. Enter `301` in Estimated Time<br>3. Click Save/Submit | An error message or browser validation prevents submission | Medium | Blocked |
| QM-FV-07 | Verify color field accepts valid hex codes | 1. Open the Create Lane dialog<br>2. Enter a valid hex color (e.g., `#FF5733`) in the color input<br>3. Click Save/Submit | Form submits successfully with the specified color | Low | Blocked |

> **Note:** QM-FV-01 through QM-FV-07 are **Blocked** — Queue Lane/Type creation has been moved exclusively to the Services page. Queue Management now focuses on live queue operations only; no "Create Queue Lane" form exists on this page.

### 5.2 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| QM-LN-01 | Verify Queue Management page has a clear and descriptive title | 1. Navigate to `/business/queue` | Heading "Queue Management" is clearly visible | High | Pass |
| QM-LN-02 | Verify "Current Queue" and "Queue Types" tabs are functional | 1. Navigate to `/business/queue`<br>2. Click each tab | Content switches between live queue view and queue types/services list correctly | High | Pass |
| QM-LN-03 | Verify "Generate QR Code" button triggers QR download | 1. Navigate to `/business/queue`<br>2. Click "Generate QR Code" for a service | A QR code image is downloaded or displayed | Medium | **Fail** |
| QM-LN-04 | Verify "Copy Queue Link" button copies the link to clipboard | 1. Navigate to `/business/queue`<br>2. Click "Copy Queue Link" | A success toast/notification appears confirming the link was copied | Medium | **Fail** |

---

## 6. Customers Page

### 6.1 Form Validation — Add Customer

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| CU-FV-01 | Verify mandatory fields in Add Customer form are marked with asterisk (*) | 1. Navigate to `/business/customers`<br>2. Click "Add Customer"<br>3. Inspect field labels | Name and Phone fields are marked as required (`*`) | High | Pass |
| CU-FV-02 | Verify submitting Add Customer form with valid data saves the customer | 1. Navigate to `/business/customers`<br>2. Click "Add Customer"<br>3. Enter valid Name and Phone<br>4. Click Save/Submit | The new customer appears in the customers table and data is saved to the database | High | Pass |
| CU-FV-03 | Verify submitting Add Customer form with empty Name field shows an error | 1. Navigate to `/business/customers`<br>2. Click "Add Customer"<br>3. Leave Name blank, enter a phone number<br>4. Click Save/Submit | An error message appears below the Name field | High | Pass |
| CU-FV-04 | Verify submitting Add Customer form with empty Phone field shows an error | 1. Navigate to `/business/customers`<br>2. Click "Add Customer"<br>3. Enter a name, leave Phone blank<br>4. Click Save/Submit | An error message appears below the Phone field | High | Pass |
| CU-FV-05 | Verify Email field in Add Customer form validates email format | 1. Navigate to `/business/customers`<br>2. Click "Add Customer"<br>3. Enter an invalid email (e.g., `notanemail`)<br>4. Click Save/Submit | An error message appears below the Email field indicating an invalid format | High | Not Executed |
| CU-FV-06 | Verify Email field in Add Customer form is optional | 1. Navigate to `/business/customers`<br>2. Click "Add Customer"<br>3. Fill Name and Phone, leave Email empty<br>4. Click Save/Submit | Form submits successfully without requiring an email | Medium | Pass |
| CU-FV-07 | Verify Notes field in Add Customer form is optional | 1. Navigate to `/business/customers`<br>2. Fill required fields, leave Notes blank<br>3. Click Save/Submit | Form submits successfully without notes | Low | Pass |

### 6.2 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| CU-LN-01 | Verify Customers page has a clear and descriptive title | 1. Navigate to `/business/customers` | Heading "Customers" is clearly visible | High | Pass |
| CU-LN-02 | Verify "View Details" action opens a customer detail dialog | 1. Navigate to `/business/customers`<br>2. Click the actions dropdown for a customer<br>3. Click "View Details" | A dialog or panel opens showing the customer's profile, contact info, and visit history | Medium | Not Executed |
| CU-LN-03 | Verify search input filters the customer list | 1. Navigate to `/business/customers`<br>2. Type a customer's name in the search field | The customer table is filtered to show only matching records | Medium | Pass |
| CU-LN-04 | Verify date range filter narrows the customer list | 1. Navigate to `/business/customers`<br>2. Enter a "From" and "To" date in the date filter fields | The table updates to show only customers within the specified date range | Medium | Pass |

---

## 7. Staff Management Page

### 7.1 Form Validation — Add Staff Member

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| ST-FV-01 | Verify mandatory fields in Add Staff form are marked with asterisk (*) | 1. Navigate to `/business/staff`<br>2. Click "Add Staff Member"<br>3. Inspect field labels | Full Name, Email, and Position fields are marked as required (`*`) | High | **Fail** |
| ST-FV-02 | Verify submitting Add Staff form with valid data creates a staff account | 1. Navigate to `/business/staff`<br>2. Click "Add Staff Member"<br>3. Enter valid Full Name, Email, and Position<br>4. Click Save/Submit | A new staff entry appears in the table; a credentials dialog shows the temporary password | High | Pass |
| ST-FV-03 | Verify submitting Add Staff form with empty Full Name shows an error | 1. Navigate to `/business/staff`<br>2. Click "Add Staff Member"<br>3. Leave Full Name blank, fill other required fields<br>4. Click Save/Submit | An error message appears below the Full Name field | High | Pass |
| ST-FV-04 | Verify submitting Add Staff form with empty Email field shows an error | 1. Navigate to `/business/staff`<br>2. Click "Add Staff Member"<br>3. Leave Email blank<br>4. Click Save/Submit | An error message appears below the Email field | High | Pass |
| ST-FV-05 | Verify invalid email format in Add Staff Email field shows a validation error | 1. Navigate to `/business/staff`<br>2. Click "Add Staff Member"<br>3. Enter `notanemail` in Email<br>4. Click Save/Submit | An error message appears below the Email field | High | **Fail** |
| ST-FV-06 | Verify Position field is required and shows an error if not selected | 1. Navigate to `/business/staff`<br>2. Click "Add Staff Member"<br>3. Fill Name and Email, leave Position unselected<br>4. Click Save/Submit | An error message appears below the Position field | High | **Fail** |
| ST-FV-07 | Verify Phone field in Add Staff form is optional | 1. Navigate to `/business/staff`<br>2. Click "Add Staff Member"<br>3. Fill Name, Email, and Position, leave Phone blank<br>4. Click Save/Submit | Form submits successfully without a phone number | Medium | Pass |
| ST-FV-08 | Verify the credentials dialog shows the temporary password after staff creation | 1. Successfully create a new staff member | A dialog appears showing the staff member's login email and temporary password with a copy button | High | Pass |

### 7.2 Form Validation — Edit Staff Member

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| ST-FV-09 | Verify Edit Staff form shows current values pre-filled | 1. Navigate to `/business/staff`<br>2. Click the edit (pencil) icon on a staff member | The Edit dialog opens with the existing Full Name, Phone, Position, and Status pre-filled | Medium | Pass |
| ST-FV-10 | Verify submitting Edit Staff with empty Full Name shows an error | 1. Open the Edit Staff dialog<br>2. Clear the Full Name field<br>3. Click Save/Submit | An error message appears below the Full Name field | High | Pass |
| ST-FV-11 | Verify status field (Active/Inactive) is required in Edit Staff form | 1. Open the Edit Staff dialog<br>2. Check that Status has a selection (Active/Inactive)<br>3. Save without modifying | Form should submit with a valid status; no error for a selected status | Medium | Pass |

### 7.3 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| ST-LN-01 | Verify Staff Management page has a clear and descriptive title | 1. Navigate to `/business/staff` | Heading "Staff Management" is clearly visible | High | Pass |
| ST-LN-02 | Verify the View (eye) icon opens a staff performance dialog | 1. Navigate to `/business/staff`<br>2. Click the eye icon for a staff member | A dialog opens showing the staff member's stats and contact info | Medium | Not Executed |
| ST-LN-03 | Verify the Delete icon opens a confirmation dialog before deleting | 1. Navigate to `/business/staff`<br>2. Click the delete (trash) icon for a staff member | A confirmation dialog appears asking for confirmation before deletion | High | Pass |

---

## 8. Services Page

### 8.1 Form Validation — Create / Edit Service

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| SV-FV-01 | Verify mandatory fields in Create Service form are marked with asterisk (*) | 1. Navigate to `/business/services`<br>2. Click "Add Service"<br>3. Inspect field labels | Name, Color, Estimated Service Time, and Max Capacity fields are marked as required (`*`) | High | **Fail** |
| SV-FV-02 | Verify submitting Create Service form with valid data adds a new service | 1. Navigate to `/business/services`<br>2. Click "Add Service"<br>3. Enter valid Name, Color, Estimated Time (e.g., `10`), and Max Capacity (e.g., `50`)<br>4. Click Save/Submit | A new service card appears on the page and data is saved to the database | High | Pass |
| SV-FV-03 | Verify submitting Create Service form with empty Name shows an error | 1. Navigate to `/business/services`<br>2. Click "Add Service"<br>3. Leave Name blank<br>4. Click Save/Submit | An error message appears below the Name field | High | **Fail** |
| SV-FV-04 | Verify Estimated Service Time field rejects non-numeric (alphabetic) input | 1. Open the Create Service dialog<br>2. Enter `abc` in Estimated Service Time<br>3. Click Save/Submit | A validation error appears or the field does not accept non-numeric characters | High | Not Executed |
| SV-FV-05 | Verify Estimated Service Time field does not accept values below minimum (< 1) | 1. Open the Create Service dialog<br>2. Enter `0` in Estimated Service Time<br>3. Click Save/Submit | An error message appears indicating the minimum value is 1 | Medium | Not Executed |
| SV-FV-06 | Verify Max Capacity field rejects non-numeric (alphabetic) input | 1. Open the Create Service dialog<br>2. Enter `xyz` in Max Capacity<br>3. Click Save/Submit | A validation error appears or the field does not accept non-numeric characters | High | Not Executed |
| SV-FV-07 | Verify Max Capacity field does not accept values below minimum (< 1) | 1. Open the Create Service dialog<br>2. Enter `0` in Max Capacity<br>3. Click Save/Submit | An error message appears indicating the minimum value is 1 | Medium | Not Executed |
| SV-FV-08 | Verify Price field is optional and form submits without it | 1. Open the Create Service dialog<br>2. Fill all required fields, leave Price empty<br>3. Click Save/Submit | Form submits successfully | Medium | Pass |
| SV-FV-09 | Verify Price field does not accept negative values | 1. Open the Create Service dialog<br>2. Enter `-100` in the Price field<br>3. Click Save/Submit | A validation error appears indicating the price must be ≥ 0 | Medium | Not Executed |
| SV-FV-10 | Verify Price field rejects alphabetic (non-numeric) input | 1. Open the Create Service dialog<br>2. Enter `abc` in the Price field<br>3. Click Save/Submit | A validation error is shown or non-numeric characters are rejected | High | Not Executed |
| SV-FV-11 | Verify Description field is optional and form submits without it | 1. Open the Create Service dialog<br>2. Fill required fields, leave Description blank<br>3. Click Save/Submit | Form submits successfully without any error on the Description field | Medium | Pass |

### 8.2 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| SV-LN-01 | Verify Services page has a clear and descriptive title | 1. Navigate to `/business/services` | Heading "Services" is clearly visible | High | Pass |
| SV-LN-02 | Verify Delete button on a service card opens a confirmation before deleting | 1. Navigate to `/business/services`<br>2. Click "Delete" on any service card | A confirmation dialog appears before the service is deleted | High | **Fail** |
| SV-LN-03 | Verify Edit button on a service card opens the Edit dialog with pre-filled data | 1. Navigate to `/business/services`<br>2. Click "Edit" on any service card | The Edit Service dialog opens with existing data pre-filled in all fields | Medium | Pass |

---

## 9. Business Hours Page

### 9.1 Form Validation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| BH-FV-01 | Verify form saves successfully when valid open/close times are set for a day | 1. Navigate to `/business/hours`<br>2. Toggle a day to "open"<br>3. Set a valid Open Time (e.g., `09:00`) and Close Time (e.g., `18:00`)<br>4. Click "Save Hours" | Hours are saved to the database and a success message is shown | High | Pass |
| BH-FV-02 | Verify Save button is disabled until a change is made | 1. Navigate to `/business/hours`<br>2. Do not modify any field | The "Save Hours" button is disabled or greyed out | Medium | Pass |
| BH-FV-03 | Verify Save button becomes enabled after any modification | 1. Navigate to `/business/hours`<br>2. Change the Open Time for any day | The "Save Hours" button becomes active/enabled | Medium | Pass |
| BH-FV-04 | Verify Special Hours form requires Date and Reason fields | 1. Navigate to `/business/hours`<br>2. Open the Add Special Hours dialog<br>3. Leave Date and Reason blank<br>4. Click Save/Submit | Error messages appear below the Date and Reason fields | High | Not Executed |
| BH-FV-05 | Verify Special Hours form requires open/close times when "is_closed" is not selected | 1. Open the Add Special Hours dialog<br>2. Toggle "is_closed" to OFF (open day)<br>3. Leave open and close times blank<br>4. Click Save/Submit | Error messages appear below the Open Time and Close Time fields | High | Not Executed |
| BH-FV-06 | Verify adding a Special Hour with valid data saves successfully | 1. Open the Add Special Hours dialog<br>2. Enter a future date, a reason, and valid open/close times<br>3. Click Save/Submit | The special hour entry appears in the special hours list | High | Not Executed |

### 9.2 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| BH-LN-01 | Verify Business Hours page has a clear and descriptive title | 1. Navigate to `/business/hours` | Heading "Business Hours" is clearly visible | High | Pass |
| BH-LN-02 | Verify Delete button on a special hour removes the entry | 1. Navigate to `/business/hours`<br>2. Click the delete button on a special hours entry | A confirmation occurs and/or the entry is removed from the list | High | Not Executed |

---

## 10. Settings Page

### 10.1 Form Validation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| ST2-FV-01 | Verify Settings page loads with current business information pre-filled | 1. Navigate to `/business/settings` | The Business Name, Phone, Address, and Description fields are pre-populated with the current business data | High | Pass |
| ST2-FV-02 | Verify submitting Settings form with valid data saves changes to the database | 1. Navigate to `/business/settings`<br>2. Modify Business Name (e.g., "Updated Café")<br>3. Click "Save Changes" | Changes are saved to the database and a success message is shown; the updated name is reflected on the page | High | Pass |
| ST2-FV-03 | Verify Email field is disabled and cannot be edited | 1. Navigate to `/business/settings`<br>2. Try to click or type in the Email field | The field is read-only (greyed out) and does not accept input | High | Pass |
| ST2-FV-04 | Verify Business Type field is disabled and cannot be edited | 1. Navigate to `/business/settings`<br>2. Try to click or type in the Business Type field | The field is read-only (greyed out) and does not accept input | High | Pass |
| ST2-FV-05 | Verify avatar upload accepts only allowed file types (JPG, PNG, WebP, GIF) | 1. Navigate to `/business/settings`<br>2. Click the camera/upload button on the avatar<br>3. Try to upload a `.pdf` or `.txt` file | The file picker only shows image files, or an error is shown if an unsupported file type is selected | Medium | Pass |
| ST2-FV-06 | Verify avatar upload rejects files larger than 2MB | 1. Navigate to `/business/settings`<br>2. Try to upload an image file larger than 2MB | An error message is shown indicating the file size exceeds the 2MB limit | Medium | Not Executed |
| ST2-FV-07 | Verify "Cancel" button reverts unsaved changes | 1. Navigate to `/business/settings`<br>2. Modify the Business Name field<br>3. Click "Cancel" | The field reverts to the original value; no changes are saved | High | Pass |

### 10.2 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| ST2-LN-01 | Verify Settings page has a clear and descriptive title | 1. Navigate to `/business/settings` | Heading "Business Settings" is clearly visible | High | Pass |
| ST2-LN-02 | Verify the Account Information section displays the correct subscription plan | 1. Navigate to `/business/settings` | The Subscription Plan shown matches the business's current plan from the database | Medium | Not Executed |

---

## 11. Pricing & Plans Page

### 11.1 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| PR-LN-01 | Verify Pricing page has a clear and descriptive title | 1. Navigate to `/business/pricing` | Heading "Pricing & Plans" is clearly visible | High | Pass |
| PR-LN-02 | Verify all "Upgrade Now" buttons on the Pricing page navigate to the registration page | 1. Navigate to `/business/pricing`<br>2. Click any "Upgrade Now" button | User is redirected to `/auth/v1/register` | High | Not Executed |
| PR-LN-03 | Verify the current plan is highlighted/marked for the logged-in business | 1. Log in as a business owner<br>2. Navigate to `/business/pricing` | The plan the business is currently subscribed to is marked as "Current Plan" and highlighted or has a different button state | High | Pass |
| PR-LN-04 | Verify payment history table is displayed if payments exist | 1. Log in as a business owner that has payment history<br>2. Navigate to `/business/pricing` | A payment history table is visible with correct payment records | Medium | Pass |

---

## 12. Orders Page

### 12.1 Form Validation — Add Order

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| OR-FV-01 | Verify mandatory fields in Add Order form are marked with asterisk (*) | 1. Navigate to `/business/orders`<br>2. Click "Add Order"<br>3. Inspect field labels | Customer Name, Customer Phone, and at least one order item (Name, Quantity, Price) are marked as required (`*`) | High | Pass |
| OR-FV-02 | Verify submitting Add Order form with valid data creates an order | 1. Navigate to `/business/orders`<br>2. Click "Add Order"<br>3. Enter valid Customer Name, Phone, and at least one item with quantity and price<br>4. Click Save/Submit | A new order appears in the orders table and the total is correctly calculated | High | **Fail** |
| OR-FV-03 | Verify submitting Add Order form with empty Customer Name shows an error | 1. Navigate to `/business/orders`<br>2. Click "Add Order"<br>3. Leave Customer Name blank, fill other fields<br>4. Click Save/Submit | An error message appears below the Customer Name field | High | Pass |
| OR-FV-04 | Verify submitting Add Order form with empty Customer Phone shows an error | 1. Navigate to `/business/orders`<br>2. Click "Add Order"<br>3. Leave Customer Phone blank, fill other fields<br>4. Click Save/Submit | An error message appears below the Customer Phone field | High | Pass |
| OR-FV-05 | Verify Customer Email field in Add Order is optional | 1. Navigate to `/business/orders`<br>2. Click "Add Order"<br>3. Fill Customer Name and Phone, leave Email blank<br>4. Add an item and submit | Form submits successfully without an email | Medium | Pass |
| OR-FV-06 | Verify Customer Email format is validated in Add Order form | 1. Navigate to `/business/orders`<br>2. Click "Add Order"<br>3. Enter an invalid email (e.g., `bademail`)<br>4. Click Save/Submit | An error message appears below the Customer Email field | High | Not Executed |
| OR-FV-07 | Verify Item Quantity field rejects non-numeric (alphabetic) input | 1. Open the Add Order dialog<br>2. Enter `abc` in the Quantity field of an item<br>3. Click Save/Submit | A validation error appears or the field does not accept non-numeric characters | High | Not Executed |
| OR-FV-08 | Verify Item Quantity field does not accept values ≤ 0 | 1. Open the Add Order dialog<br>2. Enter `0` or `-1` in the Quantity field<br>3. Click Save/Submit | A validation error appears indicating quantity must be greater than 0 | Medium | Not Executed |
| OR-FV-09 | Verify Item Price field rejects non-numeric (alphabetic) input | 1. Open the Add Order dialog<br>2. Enter `abc` in the Price field of an item<br>3. Click Save/Submit | A validation error appears or the field does not accept non-numeric characters | High | Not Executed |
| OR-FV-10 | Verify Item Price field does not accept values ≤ 0 | 1. Open the Add Order dialog<br>2. Enter `0` or `-50` in the Price field<br>3. Click Save/Submit | A validation error appears indicating price must be greater than 0 | Medium | Not Executed |
| OR-FV-11 | Verify the order total is auto-calculated when items are entered | 1. Open the Add Order dialog<br>2. Enter an item with Quantity = `2` and Price = `500`<br>3. Observe the total | The displayed total shows `1000` (2 × 500), updating automatically | Medium | Pass |
| OR-FV-12 | Verify "Add Item" button adds a new item row to the order form | 1. Open the Add Order dialog<br>2. Click "Add Item" | A new row with Item Name, Quantity, and Price fields appears below the existing item(s) | Medium | Pass |
| OR-FV-13 | Verify "Remove Item" button removes the respective item row (when 2+ items exist) | 1. Open the Add Order dialog<br>2. Click "Add Item" to have 2+ items<br>3. Click "Remove" on one item row | The selected item row is removed from the form | Medium | Pass |

### 12.2 Links & Navigation

| TC ID | Test Case Description | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| OR-LN-01 | Verify Orders page has a clear and descriptive title | 1. Navigate to `/business/orders` | Heading "Orders" or "Track and manage customer orders" is clearly visible | High | Pass |
| OR-LN-02 | Verify clicking an Order ID in the table opens the Order details view | 1. Navigate to `/business/orders`<br>2. Click any Order # in the table | A dialog or detail view opens showing the full order information | Medium | Not Executed |
| OR-LN-03 | Verify status filter dropdown narrows the orders list | 1. Navigate to `/business/orders`<br>2. Select a status from the status filter dropdown (e.g., "Pending") | The orders table is filtered to display only orders with the selected status | Medium | Pass |

---

## Summary

| Page | Total TCs | Pass | Fail | Blocked | Not Executed |
|---|---|---|---|---|---|
| Landing Page | 13 | 12 | 1 | 0 | 0 |
| Login Page | 17 | 15 | 2 | 0 | 0 |
| Registration Page | 25 | 13 | 4 | 0 | 8 |
| Business Dashboard | 10 | 10 | 0 | 0 | 0 |
| Queue Management | 11 | 2 | 2 | 7 | 0 |
| Customers | 11 | 8 | 0 | 0 | 3 |
| Staff Management | 16 | 11 | 3 | 0 | 2 |
| Services | 14 | 6 | 3 | 0 | 5 |
| Business Hours | 8 | 4 | 0 | 0 | 4 |
| Settings | 9 | 7 | 0 | 0 | 2 |
| Pricing & Plans | 4 | 3 | 0 | 0 | 1 |
| Orders | 16 | 8 | 1 | 0 | 7 |
| **TOTAL** | **154** | **99** | **16** | **7** | **32** |

### Defects Summary (16 Failures)

| # | TC ID | Page | Severity | Description |
|---|---|---|---|---|
| 1 | LP-LN-08 | Landing Page | Medium | No logo/brand link to homepage — clicking logo area does nothing |
| 2 | LG-FV-01 | Login Page | Low | No asterisk (*) markers on Email and Password required fields |
| 3 | LG-LN-05 | Login Page | Medium | No logo/brand link to homepage from Login page |
| 4 | RG-FV-01 | Register Page | Low | No asterisk (*) markers on Business Owner form required fields |
| 5 | RG-FV-13 | Register Page | Medium | Selecting "Other" as Business Type does NOT reveal a custom text input field |
| 6 | RG-FV-17 | Register Page | Low | No asterisk (*) markers on Platform Admin form required fields |
| 7 | RG-LN-04 | Register Page | Medium | No logo/brand link to homepage from Registration page |
| 8 | QM-LN-03 | Queue Management | High | Generate QR Code fails — Spring Boot API returns HTTP 500 error |
| 9 | QM-LN-04 | Queue Management | Medium | "Copy Queue Link" button does not exist on Queue Management page |
| 10 | ST-FV-01 | Staff Management | Low | Position field not marked with asterisk (*) despite being expected as required |
| 11 | ST-FV-05 | Staff Management | High | Invalid email format accepted in Add Staff form — no client-side email format validation |
| 12 | ST-FV-06 | Staff Management | High | Position field is NOT enforced as required — form submits without selecting a position |
| 13 | SV-FV-01 | Services | Low | Only "Service Name *" is marked; Color, Est. Time, Max Capacity lack asterisk markers |
| 14 | SV-FV-03 | Services | Medium | Empty name validation shown as toast notification, not as an inline error below the field |
| 15 | SV-LN-02 | Services | High | Delete service fires immediately WITHOUT a confirmation dialog |
| 16 | OR-FV-02 | Orders | High | Create Order fails silently — POST /api/orders returns HTTP 500, no error message shown to user |

---

*End of Functional Test Cases Document*
