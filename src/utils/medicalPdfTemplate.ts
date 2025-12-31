import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// HTML escape function to prevent XSS attacks
const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

interface PatientInfo {
  first_name?: string;
  last_name?: string;
  id_number?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  city?: string;
}

interface ClinicInfo {
  doctor_name?: string;
  doctor_license?: string;
  doctor_specialty?: string;
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  clinic_fax?: string;
  clinic_district?: string;
}

interface VisitData {
  visit_date: string;
  visit_summary?: string;
  treatment_plan?: string;
  medications?: string;
  current_diagnoses?: string;
  past_diagnoses?: string;
  measurements?: {
    height?: string;
    weight?: string;
    bmi?: string;
    blood_pressure?: string;
  };
}

interface SignatureInfo {
  signature_data: string;
  signer_name: string;
  signed_at: string;
}

export function generateMedicalVisitSummaryPdf(
  patient: PatientInfo,
  clinic: ClinicInfo,
  visit: VisitData,
  signature?: SignatureInfo
): string {
  const patientFullName = `${patient.last_name || ''} ${patient.first_name || ''}`.trim();
  const visitDate = format(new Date(visit.visit_date), 'dd/MM/yyyy', { locale: he });
  const patientDob = patient.date_of_birth 
    ? format(new Date(patient.date_of_birth), 'dd/MM/yyyy', { locale: he })
    : '';
  
  // Calculate age if DOB available
  let age = '';
  if (patient.date_of_birth) {
    const dob = new Date(patient.date_of_birth);
    const today = new Date();
    age = String(Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
  }

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>סיכום מידע רפואי</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'David', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.4;
      margin: 0;
      padding: 20px;
      direction: rtl;
      background: white;
      color: #000;
    }
    
    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0066cc;
    }
    
    .logo-section {
      width: 100px;
    }
    
    .logo-section img {
      max-width: 80px;
      max-height: 60px;
    }
    
    .header-info {
      display: flex;
      gap: 30px;
      font-size: 10pt;
    }
    
    .header-col {
      text-align: right;
    }
    
    .header-label {
      color: #0066cc;
      font-size: 9pt;
    }
    
    .header-value {
      font-weight: bold;
    }
    
    /* Title */
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      color: #0066cc;
      margin: 15px 0;
    }
    
    .date-row {
      text-align: right;
      margin-bottom: 15px;
      font-size: 10pt;
    }
    
    /* Patient Info Section */
    .section {
      margin-bottom: 15px;
    }
    
    .section-title {
      color: #0066cc;
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 5px;
      padding-bottom: 2px;
      border-bottom: 1px solid #0066cc;
    }
    
    /* Info Box */
    .info-box {
      background: #f0f8ff;
      border: 1px solid #cce0ff;
      padding: 10px;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .info-item {
      display: flex;
      gap: 5px;
    }
    
    .info-label {
      color: #0066cc;
      font-size: 9pt;
      white-space: nowrap;
    }
    
    .info-value {
      font-weight: bold;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 10pt;
    }
    
    th {
      background: #0066cc;
      color: white;
      padding: 5px 8px;
      text-align: right;
      font-weight: normal;
      font-size: 9pt;
    }
    
    td {
      border: 1px solid #ccc;
      padding: 4px 8px;
      vertical-align: top;
    }
    
    .table-label {
      color: #0066cc;
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 3px;
    }
    
    /* Diagnoses tables */
    .diagnoses-section {
      margin-bottom: 15px;
    }
    
    /* Medications table */
    .medications-header {
      background: #0066cc;
      color: white;
      padding: 5px 10px;
      font-weight: bold;
    }
    
    /* Content sections */
    .content-box {
      border: 1px solid #ddd;
      padding: 10px;
      margin-bottom: 10px;
      min-height: 60px;
      white-space: pre-wrap;
    }
    
    /* Signature Section */
    .signature-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .signature-box {
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    
    .signature-img {
      max-width: 150px;
      max-height: 60px;
      border: 1px solid #ddd;
    }
    
    .signature-details {
      font-size: 9pt;
    }
    
    .digital-badge {
      background: #e6f3e6;
      border: 1px solid #4caf50;
      padding: 3px 8px;
      font-size: 8pt;
      color: #2e7d32;
      display: inline-block;
      margin-top: 5px;
    }
    
    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 2px solid #0066cc;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }
    
    .disclaimer {
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      margin-top: 15px;
      padding: 8px;
      background: #f5f5f5;
      border: 1px solid #ddd;
    }
    
    /* Patient identifier footer */
    .patient-footer {
      position: fixed;
      bottom: 10mm;
      left: 15mm;
      right: 15mm;
      font-size: 8pt;
      color: #666;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #ccc;
      padding-top: 5px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .patient-footer {
        position: fixed;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="logo-section">
      <!-- Doctor's logo placeholder - will be replaced with actual logo -->
      <div style="width: 70px; height: 50px; border: 1px solid #0066cc; display: flex; align-items: center; justify-content: center; color: #0066cc; font-size: 8pt;">לוגו</div>
    </div>
    
    <div class="header-info">
      <div class="header-col">
        <div><span class="header-label">שם הרופא</span></div>
        <div class="header-value">${escapeHtml(clinic.doctor_name || '')}</div>
      </div>
      <div class="header-col">
        <div><span class="header-label">תחום</span></div>
        <div class="header-value">${escapeHtml(clinic.doctor_specialty || '')}</div>
      </div>
      <div class="header-col">
        <div><span class="header-label">כתובת</span></div>
        <div class="header-value">${escapeHtml(clinic.clinic_address || '')}</div>
      </div>
      <div class="header-col">
        <div><span class="header-label">מספר רישיון</span></div>
        <div class="header-value">${escapeHtml(clinic.doctor_license || '')}</div>
      </div>
      <div class="header-col">
        <div><span class="header-label">טלפון</span></div>
        <div class="header-value">${escapeHtml(clinic.clinic_phone || '')}</div>
      </div>
    </div>
  </div>
  
  <!-- Date -->
  <div class="date-row">
    <strong>תאריך:</strong> ${visitDate}
  </div>
  
  <!-- Title -->
  <div class="title">סיכום מידע רפואי</div>
  
  <!-- Patient Details -->
  <div class="section">
    <div class="section-title">פרטי המטופל</div>
    <div class="info-box">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">שם משפחה ופרטי:</span>
          <span class="info-value">${escapeHtml(patientFullName)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">מס׳ זהות:</span>
          <span class="info-value">${escapeHtml(patient.id_number || '')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">גיל:</span>
          <span class="info-value">${age}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ת. לידה:</span>
          <span class="info-value">${patientDob}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ישוב:</span>
          <span class="info-value">${escapeHtml(patient.city || '')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">רחוב:</span>
          <span class="info-value">${escapeHtml(patient.address || '')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">טלפון:</span>
          <span class="info-value">${escapeHtml(patient.phone || '')}</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Measurements -->
  ${visit.measurements && (visit.measurements.height || visit.measurements.weight || visit.measurements.bmi || visit.measurements.blood_pressure) ? `
  <div class="section">
    <div class="section-title">מדידות</div>
    <div class="info-box">
      <div class="info-grid">
        ${visit.measurements.height ? `<div class="info-item"><span class="info-label">גובה:</span><span class="info-value">${visit.measurements.height} ס״מ</span></div>` : ''}
        ${visit.measurements.weight ? `<div class="info-item"><span class="info-label">משקל:</span><span class="info-value">${visit.measurements.weight} ק״ג</span></div>` : ''}
        ${visit.measurements.bmi ? `<div class="info-item"><span class="info-label">BMI:</span><span class="info-value">${visit.measurements.bmi}</span></div>` : ''}
        ${visit.measurements.blood_pressure ? `<div class="info-item"><span class="info-label">לחץ דם:</span><span class="info-value">${visit.measurements.blood_pressure}</span></div>` : ''}
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- Diagnoses -->
  ${visit.current_diagnoses ? `
  <div class="diagnoses-section">
    <div class="table-label" style="color: #0066cc;">אבחנה - מצב בריאותי</div>
    <div class="section-title">Current Diagnoses - בעיות פעילות</div>
    <div class="content-box">${escapeHtml(visit.current_diagnoses).replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}
  
  ${visit.past_diagnoses ? `
  <div class="diagnoses-section">
    <div class="section-title">Past Diagnoses - בעיות עבר</div>
    <div class="content-box">${escapeHtml(visit.past_diagnoses).replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}
  
  <!-- Medications -->
  ${visit.medications ? `
  <div class="section">
    <div class="medications-header">Medications - תרופות קבועות</div>
    <div class="content-box">${escapeHtml(visit.medications).replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}
  
  <!-- Visit Summary -->
  ${visit.visit_summary ? `
  <div class="section">
    <div class="section-title">סיכום הביקור</div>
    <div class="content-box">${escapeHtml(visit.visit_summary).replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}
  
  <!-- Treatment Plan -->
  ${visit.treatment_plan ? `
  <div class="section">
    <div class="section-title">תוכנית טיפול</div>
    <div class="content-box">${escapeHtml(visit.treatment_plan).replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}
  
  <!-- Signature -->
  ${signature ? `
  <div class="signature-section">
    <div class="signature-box">
      <div>
        <div style="font-size: 9pt; color: #666;">חתימה ותחתומת הרופא</div>
        <img src="${signature.signature_data}" alt="חתימה" class="signature-img" />
      </div>
      <div class="signature-details">
        <div><strong>שם הרופא:</strong> ${escapeHtml(signature.signer_name)}</div>
        <div><strong>מספר רישיון:</strong> ${escapeHtml(clinic.doctor_license || '')}</div>
        <div class="digital-badge">**נחתם דיגיטלית**</div>
      </div>
    </div>
    <div style="text-align: left; font-size: 10pt;">
      <div><strong>מס׳ זהות:</strong> ${escapeHtml(patient.id_number || '')}</div>
    </div>
  </div>
  ` : ''}
  
  <!-- Disclaimer -->
  <div class="disclaimer">
    תעודה זו חתומה בחתימה אלקטרונית מאובטחת בהתאם להנחיות
  </div>
  
  <!-- Patient Footer -->
  <div class="patient-footer">
    <span>${escapeHtml(patientFullName)} | ת.ז: ${escapeHtml(patient.id_number || '')} | ${visitDate}</span>
    <span>${escapeHtml(clinic.clinic_name || clinic.doctor_name || '')}</span>
  </div>
</body>
</html>
  `;
}
