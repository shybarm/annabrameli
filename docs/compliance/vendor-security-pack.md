# Vendor Security Pack
## Third-Party Service Security Requirements

**Organization:** iHaveAllergy Clinic Management System  
**Version:** 1.0  
**Date:** 2024-12-29  
**Classification:** Internal - Confidential

---

## 1. Executive Summary

This document outlines security requirements and assessment criteria for third-party vendors processing Protected Health Information (PHI) or providing critical infrastructure for the iHaveAllergy Clinic Management System.

All vendors must comply with:
- ISO 27001 / ISO 27799 (Healthcare)
- GDPR (EU Data Protection)
- Applicable healthcare regulations

---

## 2. Vendor Registry

### 2.1 Current Vendors

| Vendor | Service | PHI Access | Risk Level | DPA Status |
|--------|---------|------------|------------|------------|
| Supabase | Database, Auth, Storage | Yes | Critical | ✅ Required |
| Lovable | Development Platform | Yes | Critical | ✅ In Platform |
| Resend | Email Delivery | Yes (limited) | High | ⚠️ Required |
| OpenAI | AI Processing | Potential | High | ⚠️ Required |
| hCaptcha | Bot Protection | No | Low | ✅ Not Required |

### 2.2 Vendor Classification

**Critical (Tier 1):** System cannot operate without vendor
- Supabase (database, authentication)
- Lovable (hosting, deployment)

**High (Tier 2):** Core functionality depends on vendor
- Resend (appointment reminders, notifications)
- OpenAI/Gemini (AI features)

**Medium (Tier 3):** Enhanced functionality
- hCaptcha (bot protection)

**Low (Tier 4):** Non-essential services
- Analytics (if applicable)

---

## 3. Data Processing Agreement (DPA) Requirements

### 3.1 Mandatory Clauses

All vendors processing PHI must agree to:

1. **Purpose Limitation**
   - Data used only for specified purposes
   - No secondary use without consent
   - No data for AI training without explicit agreement

2. **Data Minimization**
   - Process only necessary data
   - Delete data when no longer needed
   - Anonymize where possible

3. **Security Measures**
   - Encryption at rest and in transit
   - Access controls and authentication
   - Regular security assessments
   - Incident response procedures

4. **Breach Notification**
   - Notify within 24-48 hours of discovery
   - Provide detailed breach report
   - Cooperate with investigation
   - Support regulatory notifications

5. **Subprocessor Management**
   - Prior approval for subprocessors
   - Same obligations flow down
   - Maintain subprocessor list

6. **Audit Rights**
   - Right to audit vendor compliance
   - Access to security certifications
   - Cooperation with assessments

7. **Data Deletion**
   - Return or delete data on termination
   - Provide deletion certificate
   - Specified retention periods

### 3.2 DPA Template

```markdown
DATA PROCESSING AGREEMENT

Between: iHaveAllergy Clinic ("Controller")
And: [VENDOR NAME] ("Processor")

1. SCOPE
   This Agreement governs the processing of personal data including
   Protected Health Information (PHI) by Processor on behalf of Controller.

2. DATA CATEGORIES
   - Patient names and contact information
   - Appointment details
   - Medical notes and documents
   - Communication records

3. PROCESSING PURPOSES
   [Specific to vendor - e.g., "Email delivery for appointment reminders"]

4. SECURITY REQUIREMENTS
   Processor shall implement:
   - AES-256 encryption at rest
   - TLS 1.2+ encryption in transit
   - Multi-factor authentication for access
   - Role-based access controls
   - Regular security testing

5. BREACH NOTIFICATION
   Processor shall notify Controller of any security breach:
   - Within 24 hours of discovery for PHI breaches
   - Within 48 hours for other personal data breaches

6. AUDIT RIGHTS
   Controller may audit Processor's compliance:
   - Annual self-assessment questionnaire
   - Third-party audit reports (SOC 2, ISO 27001)
   - On-site audit with reasonable notice

7. SUBPROCESSORS
   [List approved subprocessors]
   Changes require 30-day prior notice.

8. DATA RETENTION AND DELETION
   Processor shall:
   - Retain data only for service duration
   - Delete data within 30 days of termination
   - Provide deletion confirmation

9. LIABILITY
   [As per main service agreement]

10. TERM
    Effective: [DATE]
    Duration: Coterminous with main agreement
```

---

## 4. Vendor-Specific Requirements

### 4.1 Supabase

**Service:** Database, Authentication, Storage, Edge Functions

**PHI Processed:**
- All patient records
- Authentication credentials
- Medical documents

**Required Compliance:**
- [x] SOC 2 Type II
- [x] ISO 27001
- [x] GDPR Compliant
- [ ] HIPAA BAA (if US patients)

**Security Requirements:**
- [x] Encryption at rest (AES-256)
- [x] Encryption in transit (TLS 1.3)
- [x] Row-Level Security
- [x] Database backups
- [x] Audit logging

**DPA Status:** Covered by Supabase terms; verify annually

**Review Frequency:** Quarterly

### 4.2 Resend

**Service:** Transactional Email Delivery

**PHI Processed:**
- Patient names
- Appointment details
- Contact information

**Required Compliance:**
- [x] SOC 2 Type II
- [x] GDPR Compliant
- [ ] DPA Signed

**Security Requirements:**
- [x] TLS encryption
- [x] SPF/DKIM/DMARC
- [ ] No email content logging (verify)
- [ ] Data retention < 30 days (verify)

**Specific Concerns:**
- Email content may contain appointment details
- Verify no PHI in email templates beyond minimum
- Confirm no AI training on emails

**DPA Action Required:**
1. Request Resend DPA
2. Verify data retention policy
3. Confirm processing locations

### 4.3 OpenAI / AI Providers

**Service:** AI-powered features (chat, summarization)

**PHI Processed:**
- Medical queries (sanitized)
- Document analysis (if enabled)
- Transcription content

**Required Compliance:**
- [x] SOC 2 Type II
- [x] GDPR Compliant
- [ ] DPA Signed
- [ ] No Training Agreement

**Security Requirements:**
- [x] API key security
- [x] TLS encryption
- [ ] PHI exclusion from training (critical)
- [x] Rate limiting
- [x] Output sanitization (our side)

**Critical Actions:**
1. Sign DPA with explicit no-training clause
2. Implement strict input sanitization
3. Log all AI interactions
4. Regular audit of AI outputs

**API Security Checklist:**
- [x] API key in secrets, not code
- [x] Rate limiting implemented
- [x] Error handling for API failures
- [x] Fallback behavior defined

### 4.4 hCaptcha

**Service:** Bot Protection / CAPTCHA

**PHI Processed:** None

**Security Requirements:**
- [x] Standard integration
- [x] Accessibility compliance
- [x] Privacy-respecting (no tracking)

**DPA Status:** Not required (no PHI)

---

## 5. Vendor Onboarding Checklist

### New Vendor Assessment

- [ ] **Security Questionnaire**
  - [ ] Encryption practices
  - [ ] Access controls
  - [ ] Incident response
  - [ ] Compliance certifications

- [ ] **Legal Review**
  - [ ] Terms of service
  - [ ] Privacy policy
  - [ ] Data processing locations
  - [ ] Subprocessor list

- [ ] **DPA Negotiation**
  - [ ] PHI protection clauses
  - [ ] Breach notification terms
  - [ ] Audit rights
  - [ ] Training exclusion (for AI)

- [ ] **Technical Assessment**
  - [ ] API security review
  - [ ] Integration testing
  - [ ] Failover procedures
  - [ ] Data minimization review

- [ ] **Approval**
  - [ ] Security team sign-off
  - [ ] Legal sign-off
  - [ ] Management approval
  - [ ] Contract signed

---

## 6. Ongoing Vendor Management

### Quarterly Review
- Security certification status
- Incident reports
- Service level compliance
- Subprocessor changes

### Annual Assessment
- Full security questionnaire
- DPA review
- Access audit
- Penetration test results

### Continuous Monitoring
- Availability monitoring
- Security bulletin review
- Compliance updates
- Breach notifications

---

## 7. Vendor Termination Checklist

- [ ] Data export completed
- [ ] Deletion request sent
- [ ] Deletion confirmation received
- [ ] Access credentials revoked
- [ ] Integration removed from code
- [ ] Documentation updated
- [ ] Alternative vendor activated (if needed)

---

## 8. Security Questionnaire Template

```markdown
VENDOR SECURITY QUESTIONNAIRE

Company Information:
- Legal Name:
- Address:
- Security Contact:
- DPO Contact (if applicable):

Certifications:
- [ ] SOC 2 Type II (attach report)
- [ ] ISO 27001 (attach certificate)
- [ ] ISO 27799 (healthcare)
- [ ] Other:

Data Processing:
1. Where is data stored? (countries/regions)
2. Who has access to customer data?
3. How is data encrypted at rest?
4. How is data encrypted in transit?
5. What is data retention period?

Security Controls:
1. How are authentication credentials protected?
2. Is MFA required for access?
3. How often are penetration tests conducted?
4. What is your incident response time?
5. Have you had any breaches in the past 3 years?

Subprocessors:
1. Do you use subprocessors?
2. List all subprocessors:
3. How do you vet subprocessors?

AI/ML (if applicable):
1. Is customer data used for AI training?
2. How is data anonymized for AI?
3. Can we opt out of AI training?

Compliance:
1. Are you GDPR compliant?
2. Are you HIPAA compliant?
3. Have you been audited in the past year?
```

---

**Document Owner:** Compliance Team  
**Last Updated:** 2024-12-29  
**Next Review:** 2025-06-29
