# Statement of Applicability (SoA)
## ISO 27799:2016 Healthcare Information Security

**Organization:** iHaveAllergy Clinic Management System  
**Document Version:** 1.0  
**Date:** 2024-12-29  
**Classification:** Internal - Confidential

---

## 1. Scope

This Statement of Applicability covers the information security controls implemented for the iHaveAllergy Clinic Management System, including:

- Public website and booking system
- Patient portal
- Admin dashboard
- Backend APIs and Edge Functions
- Database (PostgreSQL with RLS)
- File storage (Supabase Storage)
- Authentication system (Supabase Auth)

---

## 2. Control Implementation Status

### A.5 Information Security Policies

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.5.1.1 | Policies for information security | ✅ Implemented | Security policies defined in codebase and documentation |
| A.5.1.2 | Review of policies | ⚠️ Partial | Regular code reviews; formal policy review schedule needed |

### A.6 Organization of Information Security

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.6.1.1 | Information security roles | ✅ Implemented | Role-based access (admin, doctor, secretary, patient) |
| A.6.1.2 | Segregation of duties | ✅ Implemented | Separate roles with distinct permissions via RLS |
| A.6.2.1 | Mobile device policy | ⚠️ Partial | Responsive design; no MDM integration |
| A.6.2.2 | Teleworking | ✅ Implemented | Cloud-native, secure remote access |

### A.7 Human Resource Security

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.7.1.1 | Screening | ❌ N/A | Outside system scope (HR responsibility) |
| A.7.2.2 | Information security awareness | ⚠️ Partial | In-app tutorials; formal training program needed |
| A.7.3.1 | Termination responsibilities | ✅ Implemented | Role removal via admin dashboard |

### A.8 Asset Management

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.8.1.1 | Inventory of assets | ✅ Implemented | Database schema documents all data assets |
| A.8.1.2 | Ownership of assets | ✅ Implemented | Patient documents tied to patient_id |
| A.8.2.1 | Classification of information | ✅ Implemented | PHI flagged in database schema |
| A.8.2.3 | Handling of assets | ✅ Implemented | Secure storage with RLS policies |
| A.8.3.1 | Management of removable media | ❌ N/A | Cloud-only system |
| A.8.3.2 | Disposal of media | ✅ Implemented | Automatic cleanup of expired data |

### A.9 Access Control

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.9.1.1 | Access control policy | ✅ Implemented | Row-Level Security (RLS) policies |
| A.9.1.2 | Access to networks and services | ✅ Implemented | JWT-based authentication |
| A.9.2.1 | User registration/de-registration | ✅ Implemented | Supabase Auth with invitation flow |
| A.9.2.2 | User access provisioning | ✅ Implemented | Role-based provisioning via team invitations |
| A.9.2.3 | Management of privileged access | ✅ Implemented | Admin role with separate permissions |
| A.9.2.4 | Management of secret info | ✅ Implemented | Secrets stored in Supabase Vault |
| A.9.2.5 | Review of user access rights | ⚠️ Partial | Audit logs available; automated review needed |
| A.9.2.6 | Removal of access rights | ✅ Implemented | Role removal functionality |
| A.9.3.1 | Use of secret authentication | ✅ Implemented | Password + MFA support |
| A.9.4.1 | Information access restriction | ✅ Implemented | RLS policies per table |
| A.9.4.2 | Secure log-on procedures | ✅ Implemented | Supabase Auth with rate limiting |
| A.9.4.3 | Password management system | ✅ Implemented | Supabase Auth handles passwords |
| A.9.4.4 | Use of privileged utility programs | ✅ Implemented | Service role restricted to edge functions |
| A.9.4.5 | Access control to program source | ✅ Implemented | GitHub access controls |

### A.10 Cryptography

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.10.1.1 | Policy on use of cryptographic controls | ✅ Implemented | TLS 1.3 for all communications |
| A.10.1.2 | Key management | ✅ Implemented | Supabase manages encryption keys |

### A.11 Physical and Environmental Security

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.11.1.x | Secure areas | ❌ N/A | Cloud-hosted (Supabase/Lovable responsibility) |
| A.11.2.x | Equipment | ❌ N/A | Cloud-hosted |

### A.12 Operations Security

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.12.1.1 | Documented operating procedures | ⚠️ Partial | Code documentation; runbooks needed |
| A.12.1.2 | Change management | ✅ Implemented | Git-based version control |
| A.12.1.3 | Capacity management | ✅ Implemented | Auto-scaling via Supabase |
| A.12.1.4 | Separation of environments | ⚠️ Partial | Preview vs production; staging recommended |
| A.12.2.1 | Controls against malware | ✅ Implemented | File scanning for uploads |
| A.12.3.1 | Information backup | ✅ Implemented | Supabase automated backups |
| A.12.4.1 | Event logging | ✅ Implemented | PHI access logs, audit trails |
| A.12.4.2 | Protection of log information | ✅ Implemented | Immutable audit logs (no UPDATE/DELETE) |
| A.12.4.3 | Administrator/operator logs | ✅ Implemented | All actions logged |
| A.12.4.4 | Clock synchronization | ✅ Implemented | UTC timestamps throughout |
| A.12.5.1 | Installation of software | ✅ Implemented | Controlled deployment pipeline |
| A.12.6.1 | Management of technical vulnerabilities | ⚠️ Partial | Dependency updates; formal scanning needed |
| A.12.6.2 | Restrictions on software installation | ✅ Implemented | Lovable controlled environment |
| A.12.7.1 | Audit controls | ✅ Implemented | Comprehensive audit logging |

### A.13 Communications Security

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.13.1.1 | Network controls | ✅ Implemented | Supabase network security |
| A.13.1.2 | Security of network services | ✅ Implemented | TLS encryption, API security |
| A.13.1.3 | Segregation in networks | ✅ Implemented | RLS provides logical segregation |
| A.13.2.1 | Information transfer policies | ✅ Implemented | Secure API communications |
| A.13.2.3 | Electronic messaging | ⚠️ Partial | Email/WhatsApp via Resend; DPA required |
| A.13.2.4 | Confidentiality agreements | ⚠️ Partial | Vendor agreements needed |

### A.14 System Acquisition, Development and Maintenance

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.14.1.1 | Security requirements analysis | ✅ Implemented | Security built into development |
| A.14.1.2 | Securing application services | ✅ Implemented | HTTPS, authentication, authorization |
| A.14.1.3 | Protecting application transactions | ✅ Implemented | Database transactions, RLS |
| A.14.2.1 | Secure development policy | ✅ Implemented | Security-first development |
| A.14.2.2 | System change control | ✅ Implemented | Git version control |
| A.14.2.3 | Technical review of applications | ✅ Implemented | Code review process |
| A.14.2.4 | Restrictions on changes | ✅ Implemented | Migration approval required |
| A.14.2.5 | Secure system engineering | ✅ Implemented | TypeScript, Zod validation |
| A.14.2.6 | Secure development environment | ✅ Implemented | Lovable sandboxed environment |
| A.14.2.7 | Outsourced development | ⚠️ Partial | AI development; human review required |
| A.14.2.8 | System security testing | ⚠️ Partial | Basic testing; penetration testing needed |
| A.14.2.9 | System acceptance testing | ⚠️ Partial | Functional testing; security testing needed |
| A.14.3.1 | Protection of test data | ✅ Implemented | Separate test environment |

### A.15 Supplier Relationships

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.15.1.1 | Information security policy for suppliers | ⚠️ Partial | Vendor assessment needed |
| A.15.1.2 | Addressing security in supplier agreements | ⚠️ Partial | DPAs needed for Resend, OpenAI |
| A.15.1.3 | ICT supply chain | ✅ Implemented | Managed via Lovable/Supabase |
| A.15.2.1 | Monitoring supplier services | ⚠️ Partial | Basic monitoring; formal review needed |
| A.15.2.2 | Managing changes to supplier services | ⚠️ Partial | Version pinning; change management needed |

### A.16 Information Security Incident Management

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.16.1.1 | Responsibilities and procedures | ⚠️ Partial | Incident response runbooks created |
| A.16.1.2 | Reporting security events | ⚠️ Partial | Logging in place; alerting needed |
| A.16.1.3 | Reporting security weaknesses | ⚠️ Partial | Internal; public disclosure policy needed |
| A.16.1.4 | Assessment of security events | ⚠️ Partial | Manual review; automated detection needed |
| A.16.1.5 | Response to security incidents | ⚠️ Partial | Runbooks created |
| A.16.1.6 | Learning from security incidents | ❌ Not Implemented | Post-incident review process needed |
| A.16.1.7 | Collection of evidence | ✅ Implemented | Comprehensive audit logging |

### A.17 Business Continuity Management

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.17.1.1 | Planning information security continuity | ⚠️ Partial | Basic backup; formal BCP needed |
| A.17.1.2 | Implementing continuity | ✅ Implemented | Cloud-native redundancy |
| A.17.1.3 | Verify, review, evaluate continuity | ⚠️ Partial | Testing schedule needed |
| A.17.2.1 | Availability of facilities | ✅ Implemented | Multi-region Supabase |

### A.18 Compliance

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| A.18.1.1 | Applicable legislation | ⚠️ Partial | GDPR consent; full compliance review needed |
| A.18.1.2 | Intellectual property rights | ✅ Implemented | License compliance |
| A.18.1.3 | Protection of records | ✅ Implemented | Encrypted storage, access controls |
| A.18.1.4 | Privacy and PII protection | ✅ Implemented | RLS, consent management |
| A.18.1.5 | Regulation of cryptographic controls | ✅ Implemented | Standard TLS implementation |
| A.18.2.1 | Independent review of security | ❌ Not Implemented | External audit recommended |
| A.18.2.2 | Compliance with security policies | ⚠️ Partial | Internal review; formal audit needed |
| A.18.2.3 | Technical compliance review | ⚠️ Partial | Code security; formal review needed |

---

## 3. ISO 27799 Healthcare-Specific Controls

### Health Information Protection

| Control | Description | Status | Implementation Notes |
|---------|-------------|--------|---------------------|
| PHI Classification | All PHI fields identified | ✅ Implemented | Database schema annotated |
| Minimum Necessary | Data access limited to need | ✅ Implemented | RLS enforces per-user access |
| Patient Rights | Access to own records | ✅ Implemented | Patient portal |
| Consent Management | GDPR and clinical consent | ✅ Implemented | consent_signed fields |
| Audit Trail | All PHI access logged | ✅ Implemented | phi_access_log table |
| Data Retention | Configurable retention | ⚠️ Partial | cleanup_expired_data function |
| Emergency Access | Break-glass procedure | ❌ Not Implemented | Needs development |
| AI Safety | PHI protection in AI | ✅ Implemented | Output sanitization |

---

## 4. Summary

| Category | Implemented | Partial | Not Implemented | N/A |
|----------|-------------|---------|-----------------|-----|
| A.5 Policies | 1 | 1 | 0 | 0 |
| A.6 Organization | 3 | 1 | 0 | 0 |
| A.7 HR Security | 1 | 1 | 0 | 1 |
| A.8 Asset Mgmt | 4 | 0 | 0 | 2 |
| A.9 Access Control | 14 | 1 | 0 | 0 |
| A.10 Cryptography | 2 | 0 | 0 | 0 |
| A.11 Physical | 0 | 0 | 0 | 2 |
| A.12 Operations | 10 | 3 | 0 | 0 |
| A.13 Communications | 4 | 2 | 0 | 0 |
| A.14 Development | 9 | 4 | 0 | 0 |
| A.15 Supplier | 1 | 4 | 0 | 0 |
| A.16 Incident | 1 | 5 | 1 | 0 |
| A.17 Continuity | 2 | 2 | 0 | 0 |
| A.18 Compliance | 4 | 3 | 1 | 0 |
| **Total** | **56** | **27** | **2** | **5** |

**Overall Compliance Rate:** 62% Fully Implemented, 30% Partial, 2% Not Implemented, 6% N/A

---

## 5. Remediation Priorities

### Critical (Immediate Action)
1. Implement external security audit
2. Complete vendor DPAs (Resend, OpenAI)
3. Establish formal incident response procedures

### High Priority (30 Days)
1. Penetration testing
2. Security awareness training program
3. Break-glass emergency access

### Medium Priority (90 Days)
1. Business continuity plan
2. Formal policy review schedule
3. Automated security scanning

---

**Document Owner:** Security Team  
**Next Review Date:** 2025-03-29
