# Incident Response Runbooks
## iHaveAllergy Clinic Management System

**Version:** 1.0  
**Date:** 2024-12-29  
**Classification:** Internal - Restricted

---

## 1. PHI Breach Incident

### 1.1 Detection Indicators
- Unusual audit log patterns (bulk data access)
- Unauthorized access attempts in auth logs
- User reports of data they shouldn't see
- External breach notification from vendor

### 1.2 Immediate Actions (0-15 minutes)

1. **Confirm Incident**
   ```sql
   -- Check recent PHI access patterns
   SELECT actor_id, actor_role, table_name, action, COUNT(*) as access_count
   FROM phi_access_log
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY actor_id, actor_role, table_name, action
   ORDER BY access_count DESC;
   ```

2. **Isolate Compromised Accounts**
   ```sql
   -- Disable suspicious user sessions
   DELETE FROM active_sessions
   WHERE user_id = '[COMPROMISED_USER_ID]';
   
   -- Revoke all roles
   UPDATE user_roles
   SET permissions = '{}'::jsonb
   WHERE user_id = '[COMPROMISED_USER_ID]';
   ```

3. **Document Timeline**
   - First detection time
   - Accounts involved
   - Data potentially exposed
   - Actions taken

### 1.3 Investigation (15-60 minutes)

1. **Scope Assessment**
   ```sql
   -- Identify all affected records
   SELECT DISTINCT record_id, table_name
   FROM phi_access_log
   WHERE actor_id = '[COMPROMISED_USER_ID]'
     AND created_at > '[BREACH_START_TIME]';
   ```

2. **Identify Attack Vector**
   - Check auth logs for failed attempts
   - Review edge function logs
   - Check for API abuse patterns

3. **Affected Patient List**
   ```sql
   -- Get list of affected patients
   SELECT DISTINCT p.id, p.first_name, p.last_name, p.email
   FROM patients p
   JOIN phi_access_log pal ON pal.record_id = p.id
   WHERE pal.actor_id = '[COMPROMISED_USER_ID]'
     AND pal.created_at > '[BREACH_START_TIME]';
   ```

### 1.4 Containment (1-4 hours)

1. **Password Reset**
   - Force password reset for affected accounts
   - Invalidate all sessions

2. **Access Review**
   - Audit all staff permissions
   - Remove excessive access

3. **System Hardening**
   - Review and tighten RLS policies if needed
   - Enable additional MFA if not already required

### 1.5 Notification Requirements

| Timeline | Action | Responsible |
|----------|--------|-------------|
| 72 hours | Regulatory notification (GDPR) | Compliance Officer |
| ASAP | Affected patients | Clinic Management |
| 24 hours | Internal stakeholders | Security Team |

### 1.6 Documentation Template

```markdown
# PHI Breach Report

**Incident ID:** [AUTO-GENERATED]
**Detection Date/Time:** 
**Reported By:**

## Timeline
- [TIME] - [EVENT]

## Affected Data
- Number of patients:
- Types of data exposed:
- Duration of exposure:

## Root Cause

## Actions Taken

## Remediation Steps

## Lessons Learned
```

---

## 2. Credential Compromise

### 2.1 Detection Indicators
- Login from unusual location/IP
- Multiple failed login attempts
- Password reset not initiated by user
- Session from multiple geographic locations

### 2.2 Immediate Actions (0-15 minutes)

1. **Terminate Sessions**
   ```sql
   DELETE FROM active_sessions
   WHERE user_id = '[AFFECTED_USER_ID]';
   ```

2. **Disable Account (if needed)**
   - Contact Supabase support for account suspension
   - Document reason and time

3. **Reset Credentials**
   - Initiate password reset
   - Revoke any API tokens

### 2.3 Investigation

1. **Access History**
   ```sql
   -- Recent authentication attempts
   SELECT * FROM auth_logs
   WHERE user_id = '[AFFECTED_USER_ID]'
     AND timestamp > NOW() - INTERVAL '7 days'
   ORDER BY timestamp DESC;
   ```

2. **Activity Review**
   ```sql
   -- All actions by compromised account
   SELECT * FROM audit_log
   WHERE user_id = '[AFFECTED_USER_ID]'
     AND created_at > '[COMPROMISE_ESTIMATED_TIME]'
   ORDER BY created_at;
   ```

3. **Impact Assessment**
   - Data accessed during compromise period
   - Changes made to system
   - Other accounts potentially affected

### 2.4 Recovery

1. **Account Restoration**
   - Verify user identity out-of-band
   - Reset password with strong requirements
   - Enable MFA if not already active

2. **Access Audit**
   - Review permissions granted
   - Remove any unauthorized changes

3. **Monitoring**
   - Enhanced logging for 30 days
   - Alert on unusual access patterns

---

## 3. AI Data Exposure

### 3.1 Detection Indicators
- AI output containing identifiable PHI
- Unusual AI function invocations
- AI logs showing unsanitized input
- User report of AI revealing patient data

### 3.2 Immediate Actions (0-15 minutes)

1. **Disable Affected Function**
   ```toml
   # supabase/config.toml - temporarily disable
   [functions.chat-assistant]
   enabled = false
   ```

2. **Review AI Logs**
   ```sql
   SELECT * FROM ai_output_log
   WHERE phi_detected = true
     AND created_at > NOW() - INTERVAL '24 hours';
   ```

3. **Identify Scope**
   - Which AI function was involved
   - What prompts triggered exposure
   - Who received exposed data

### 3.3 Containment

1. **AI Function Audit**
   - Review input sanitization
   - Check output filtering
   - Verify consent requirements

2. **Vendor Communication**
   - Notify AI provider (OpenAI/Anthropic)
   - Request training data deletion if applicable
   - Document provider response

3. **System Updates**
   - Enhance PHI detection regex
   - Add additional output filtering
   - Implement prompt injection protection

### 3.4 Prevention Measures

```typescript
// Enhanced PHI detection patterns
const PHI_PATTERNS = [
  /\b\d{9}\b/g, // ID numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN format
  /\b\d{10,}\b/g, // Phone/insurance numbers
  /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Names
  // Add more patterns as needed
];
```

---

## 4. Ransomware/System Compromise

### 4.1 Detection Indicators
- Unusual file encryption activity
- System performance degradation
- Ransom demands
- Unable to access data

### 4.2 Immediate Actions (0-5 minutes)

1. **ISOLATE IMMEDIATELY**
   - Do NOT interact with the system
   - Document everything visible
   - Contact security team

2. **DO NOT:**
   - Pay ransom
   - Delete any files
   - Restart systems
   - Attempt recovery without expertise

### 4.3 Escalation

1. **Contact Order:**
   - Internal Security Team
   - IT Management
   - Legal Counsel
   - Law Enforcement (if applicable)
   - Cyber Insurance (if applicable)

2. **Vendor Notification:**
   - Supabase Support (urgent)
   - Lovable Support

### 4.4 Recovery

1. **Assessment**
   - Verify backup integrity
   - Identify entry point
   - Document encrypted/affected data

2. **Restoration**
   - Clean environment setup
   - Restore from verified backups
   - Implement additional controls

3. **Post-Recovery**
   - Full security audit
   - Enhanced monitoring
   - Updated incident response procedures

---

## 5. Denial of Service (DoS)

### 5.1 Detection Indicators
- System unavailability
- Slow response times
- Unusual traffic patterns
- Rate limit exhaustion

### 5.2 Immediate Actions

1. **Verify Attack**
   - Check rate limit logs
   - Review traffic patterns
   - Confirm not a legitimate spike

2. **Activate Protections**
   - Enable additional rate limiting
   - Block suspicious IPs (if identifiable)
   - Contact Supabase support

3. **Communication**
   - Internal notification
   - User status page update (if applicable)

### 5.3 Mitigation

1. **Short-term**
   - Geographic blocking if applicable
   - Increase rate limit strictness
   - Enable challenge-based access

2. **Long-term**
   - Review CDN/WAF options
   - Implement additional caching
   - Consider DDoS protection service

---

## 6. Escalation Matrix

| Severity | Example | Response Time | Notify |
|----------|---------|---------------|--------|
| Critical | Active breach, ransomware | Immediate | All stakeholders |
| High | Credential compromise | 15 minutes | Security + Management |
| Medium | Suspicious activity | 1 hour | Security Team |
| Low | Policy violation | 24 hours | Direct supervisor |

---

## 7. Contact Information

### Internal
| Role | Name | Contact |
|------|------|---------|
| Security Lead | [TBD] | [TBD] |
| IT Admin | [TBD] | [TBD] |
| Legal | [TBD] | [TBD] |
| Management | [TBD] | [TBD] |

### External
| Service | Support Channel |
|---------|-----------------|
| Supabase | support@supabase.io |
| Lovable | support@lovable.dev |
| Resend | support@resend.com |

---

## 8. Post-Incident Checklist

- [ ] Incident documented completely
- [ ] Root cause identified
- [ ] Immediate fixes implemented
- [ ] Long-term remediation planned
- [ ] Affected parties notified
- [ ] Regulatory notifications sent (if required)
- [ ] Lessons learned documented
- [ ] Runbooks updated if needed
- [ ] Team debriefing conducted
- [ ] Follow-up actions assigned

---

**Document Owner:** Security Team  
**Last Updated:** 2024-12-29  
**Next Review:** 2025-03-29
