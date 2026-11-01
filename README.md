# 🛡️ AICTE SMARTVERIFY
AI-Powered Institutional Application Verification & Compliance Platform

**Live Demo** | **GitHub**

## 🚀 Live Demo

🌐 **Institutional Verification Application:** https://sih2026-jefo.onrender.com

💻 **GitHub Repository:** saranyareddy77/sih2026

The application provides a centralized interface for institutions to register, submit institutional applications, upload supporting documents, and track verification status. Administrators can review applications, verify documents, identify missing or expired certificates, and monitor institutional compliance.

## 📖 About the Project

AICTE SmartVerify is an institutional application verification platform designed to simplify document scrutiny and compliance assessment.

The platform allows institutions to register and log in using their own credentials, submit applications, and upload supporting documents. The system helps administrators review submitted information, identify document-related issues, and manage the institutional application verification process.

The platform provides separate access for Institution Users, Super Admins, and Scrutiny Officers. Each role has its own permissions and dashboard for managing the verification workflow.

## ✨ Key Features

🏢 Institution registration and login  
📝 Institutional application submission  
📂 Secure document upload and management  
🔎 Automated document verification  
⚠️ Expired certificate identification  
📋 Missing document detection  
🔐 Duplicate document detection  
📊 Compliance validation  
📌 Application status tracking  
👨‍💼 Super Admin dashboard  
🧑‍💻 Scrutiny Officer dashboard  
📑 Application review and scrutiny  
🔄 Review feedback and correction workflow  
🔒 Role-based access control  
🗄️ Supabase database integration  
📄 Document processing and validation  

## 🛠️ Technology Stack

### 🎨 Frontend

⚛️ React  
⚡ Vite  
🔷 TypeScript  
🎨 CSS  

### ⚙️ Backend & Database

🗄️ Supabase  
🐘 PostgreSQL  
🔐 Supabase Authentication  
📂 Supabase Storage  

### 📄 Document Verification

PDF.js  
Python (if integrated)  
SHA-256 document hashing  
Document validation  
Compliance checking  
Duplicate document detection  

## 🔄 How It Works

The application follows a structured institutional verification workflow:

1. 🌐 Open the AICTE SmartVerify application.
2. 📝 Register as an institution user.
3. 🔐 Log in using institutional credentials.
4. 🏢 Enter institutional application details.
5. 📂 Upload the required supporting documents.
6. 🚀 Submit the institutional application.
7. 🔎 Process the submitted application and documents.
8. ⚠️ Identify missing or expired documents where applicable.
9. 🔐 Check for duplicate documents.
10. 📊 Perform configured compliance validations.
11. 👨‍💼 Administrators access submitted applications.
12. 📋 Super Admins and Scrutiny Officers review application details.
13. 🔄 Review findings and feedback are provided to the institution.
14. 📌 Institutions track their application status.
15. ✅ Applications proceed through the configured review workflow.

## 📄 Institutional Application Verification

For every submitted application, the platform provides a structured verification process containing:

**Institution Details**

Institution name and submitted institutional information.

**Application Details**

Information provided by the institution during application submission.

**Document Verification**

Review and validation of uploaded supporting documents.

**Missing Documents**

Identification of required documents that have not been submitted.

**Expired Certificates**

Identification of certificates that have passed their validity period.

**Duplicate Document Detection**

Identification of duplicate uploaded documents using document comparison and hashing where implemented.

**Compliance Assessment**

Validation of submitted information against configured requirements.

**Verification Findings**

Details of issues identified during document scrutiny.

**Review Feedback**

Feedback and correction requirements communicated to institutions.

**Application Status**

Current progress of the application through the verification workflow.

## 📋 Application Verification Report

| Field | Information |
|---|---|
| Institution Name | Registered institution name |
| Application Details | Submitted application information |
| Submitted Documents | Uploaded supporting documents |
| Missing Documents | Required documents not submitted |
| Expired Certificates | Certificates past their validity |
| Duplicate Documents | Duplicate document findings |
| Compliance Status | Compliance assessment |
| Verification Findings | Identified document issues |
| Scrutiny Officer | Reviewing officer |
| Review Feedback | Administrative observations |
| Application Status | Current application progress |

## 🧪 Example Verification

### ⚠️ Expired Institutional Certificate

**Description:**

An uploaded institutional certificate is identified as having a validity date that has already passed.

**Affected Component:**

Institutional document verification.

**Finding:** Expired Certificate

**Verification Process:**

1. Open the submitted institutional application.
2. Access the uploaded certificate.
3. Inspect the certificate validity information.
4. Compare the expiry date with the verification date.
5. Identify the certificate as expired when applicable.
6. Record the verification finding.
7. Make the finding available for administrative review.

**Evidence:**

Uploaded certificate and its relevant validity information.

**Business Impact:**

An expired certificate may not satisfy the applicable institutional documentation requirement.

**Recommendation:**

Request a valid, updated certificate from the institution.

## 👥 User Roles

### 🏢 Institution User

- Register using an institutional email address.
- Log in using personal registration credentials.
- Submit institutional applications.
- Upload required supporting documents.
- Track application verification status.
- View review findings and feedback.
- Submit corrections when required.

### 👨‍💼 Super Admin

- Access the Super Admin dashboard.
- Oversee institutional applications.
- Monitor verification and scrutiny activities.
- Manage administrative operations according to assigned permissions.
- Review application progress.

### 🧑‍💻 Scrutiny Officer

- Access the Scrutiny Officer dashboard.
- Review submitted institutional applications.
- Verify supporting documents.
- Examine missing or expired document findings.
- Provide scrutiny feedback.
- Track application review progress.

## 🔐 Admin Login Credentials

Administrative access is restricted to authorized administrator accounts. Institution users cannot access administrative dashboards using their institution accounts.

### 👨‍💼 Super Admin

- **Email:** `director.approval@aicte-india.org`
- **Password:** Shared privately with the authorized Super Admin.
- **Role:** Super Admin
- **Access:** Super Admin Dashboard

### 🧑‍💻 Scrutiny Officer

- **Email:** `scrutiny.officer@aicte-india.org`
- **Password:** Shared privately with the authorized Scrutiny Officer.
- **Role:** Scrutiny Officer
- **Access:** Scrutiny Officer Dashboard

### 🔒 Admin Access Control

- Only authorized administrator accounts should access admin dashboards.
- Institution users must register and log in through the institution portal.
- Admin permissions must be assigned through secure role-based authorization.
- Administrative access must be validated by the backend.
- Supabase Row Level Security (RLS) should protect application data and administrative operations.
- Admin credentials must be kept confidential and shared only with authorized personnel.

## 🏗️ Project Architecture

```text
                   👤 Institution User
                           |
                           v
                 🌐 AICTE SmartVerify UI
                           |
                           v
                  🔐 User Authentication
                           |
                           v
                📝 Institutional Application
                           |
                           v
                    📂 Document Upload
                           |
                           v
                 🗄️ Supabase Storage
                           |
                           v
                 🔎 Document Verification
                           |
                  +--------+--------+
                  |        |        |
                  v        v        v
               Missing  Expired  Duplicate
               Documents Documents Documents
                  |        |        |
                  +--------+--------+
                           |
                           v
                  📊 Compliance Checks
                           |
                           v
                  📋 Verification Results
                           |
                           v
                   👨‍💼 Admin Dashboard
                           |
                  +--------+--------+
                  |                 |
                  v                 v
              Super Admin     Scrutiny Officer
                  |                 |
                  +--------+--------+
                           |
                           v
                   📑 Application Review
                           |
                           v
                    🔄 Review Feedback
                           |
                           v
                   👤 Institution User
                           |
                           v
                    📌 Status Tracking
```

## 🎯 Project Objective

To make institutional application verification more efficient, transparent, and reliable through automated document checks, secure digital document management, and centralized administrative scrutiny.

**AICTE SmartVerify — Making Institutional Verification Smarter, Faster, and More Transparent.**
