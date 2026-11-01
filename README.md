
<div align="center">

# 🎓 AICTE SmartVerify

### AI-Powered Document Verification and Application Scrutiny Platform

<p>
  <a href="https://sih2026-jefo.onrender.com">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_Project-2ea44f?style=for-the-badge" alt="Live Demo"/>
  </a>
  <a href="https://github.com/saranyareddy77/sih2026">
    <img src="https://img.shields.io/badge/GitHub-View_Repository-181717?style=for-the-badge&logo=github" alt="GitHub Repository"/>
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=flat&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-Language-3178C6?style=flat&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=flat&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat&logo=postgresql&logoColor=white"/>
</p>

</div>

---

## 📌 About the Project

**AICTE SmartVerify** is a smart document verification and application scrutiny platform designed to streamline institutional application processing.

The platform provides a centralized system where institutions can submit applications and supporting documents, while authorized administrative users can review submissions, verify documents, track application progress, and provide feedback.

It aims to improve transparency, reduce manual verification effort, and make the application scrutiny process more organized and efficient.

---

## 👩‍💻 Project Repository

**GitHub:** https://github.com/saranyareddy77/sih2026

**Live Demo:** https://sih2026-jefo.onrender.com

---

## 🎯 Key Objectives

- Simplify institutional application submission.
- Centralize document uploads and application records.
- Support efficient document scrutiny and verification.
- Provide role-based access for different users.
- Enable application status tracking.
- Improve transparency through feedback and correction workflows.
- Reduce repetitive manual verification work.

---

## ✨ Key Features

### 🏢 Institution User

- Institution registration and login.
- Submit institutional applications.
- Upload supporting documents.
- View submitted application details.
- Track application status.
- Receive scrutiny feedback.
- Review correction requests and update submissions.

### 🛡️ Super Admin

- Administrative dashboard.
- View and oversee applications.
- Monitor application processing.
- Manage administrative operations.
- Track scrutiny progress.

### 🔍 Scrutiny Officer

- Access assigned or available applications.
- Review submitted documents.
- Examine application information.
- Record verification findings.
- Provide feedback and correction requests.
- Support application scrutiny workflows.

### 📄 Document Verification

- Document upload and storage.
- PDF document viewing using PDF.js.
- SHA-256 hashing support for document integrity checks, where implemented.
- Validation workflows for reviewing submitted documents.
- Structured feedback for document-related issues.

---

## 🧰 Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, Vite, TypeScript |
| Styling | CSS |
| Backend Services | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| PDF Processing | PDF.js |
| Document Integrity | SHA-256 hashing, where implemented |

---

## 🏗️ System Modules

| Module | Description |
|---|---|
| Authentication | Secure user login and role-based access |
| Institution Dashboard | Application submission and tracking |
| Application Management | View and manage submitted applications |
| Document Management | Upload, store, and access documents |
| Document Scrutiny | Review and verify submitted documents |
| Feedback Management | Provide corrections and verification feedback |
| Admin Dashboard | Administrative monitoring and oversight |

---

## 👥 User Roles

| User Role | Responsibilities |
|---|---|
| Institution User | Submit applications, upload documents, track status, and respond to feedback |
| Super Admin | Oversee applications and monitor administrative activities |
| Scrutiny Officer | Review applications and documents and provide scrutiny feedback |

---

## 🔐 Admin Evaluation Credentials

The following accounts are intended for authorized evaluation and role-based dashboard testing.

| Role | Login Email | Password |
|---|---|---|
| Super Admin | director.approval@aicte-india.org | SuperAdminPassword2026! |
| Scrutiny Officer | scrutiny.officer@aicte-india.org | ScrutinyOfficerPassword2026! |

**Evaluation note:** Replace the password placeholders with the approved evaluation credentials in the access-restricted evaluation copy. Do not publish reusable passwords in a public repository.

---

## 🔄 Application Workflow

1. Institution user registers or logs in.
2. Institution submits an application.
3. Required supporting documents are uploaded.
4. Application information and documents become available for scrutiny.
5. Scrutiny Officer reviews the application.
6. Verification findings and feedback are recorded.
7. Institution user views the application status and feedback.
8. Institution can make requested corrections where applicable.
9. Super Admin monitors the overall application process.

---

## 🧪 Example Verification Scenario

**Scenario: Institutional Document Review**

| Item | Example |
|---|---|
| Submitted Document | Institutional Certificate |
| Document Status | Requires Review |
| Scrutiny Action | Document examination |
| Finding | Required information is missing |
| Feedback | Institution must submit a corrected document |
| Next Step | Institution uploads the corrected document |

This demonstrates how the platform can support a structured document scrutiny and correction workflow.

---

## 🌟 Benefits

- Centralized institutional application management.
- Improved document review organization.
- Role-based access and responsibilities.
- Better visibility into application progress.
- Structured scrutiny feedback.
- Reduced manual coordination.
- Improved transparency in application processing.

---

## 🏛️ System Architecture

```text
                 ┌─────────────────────────────┐
                 │          USERS              │
                 └──────────────┬──────────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
     │ Institution  │   │ Super Admin  │   │  Scrutiny    │
     │    User      │   │              │   │   Officer    │
     └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │     React + Vite       │
                  │    TypeScript UI       │
                  └────────────┬───────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │    Supabase Services   │
                  ├────────────────────────┤
                  │ Authentication         │
                  │ Application Services   │
                  │ File Storage           │
                  └────────────┬───────────┘
                               │
                  ┌────────────┴───────────┐
                  │                        │
                  ▼                        ▼
         ┌────────────────┐      ┌────────────────┐
         │  PostgreSQL    │      │ Supabase       │
         │   Database     │      │ File Storage   │
         └────────────────┘      └────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Document Review    │
         │ PDF.js Processing  │
         │ SHA-256 Checks     │
         │ Where Implemented  │
         └────────────────────┘
```

