// Clinic-owned Apps Script. Enable the Google Calendar advanced service (v3).
// Run connectClinic once as the clinic owner. Only the printed digest goes in the database.
function connectClinic() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('bridgeKey')) {
    properties.setProperty('bridgeKey', Utilities.getUuid() + Utilities.getUuid());
  }
  const key = properties.getProperty('bridgeKey');
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key)
    .map(byte => (byte & 255).toString(16).padStart(2, '0')).join('');
  if (!ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'syncMeetRooms')) {
    ScriptApp.newTrigger('syncMeetRooms').timeBased().everyMinutes(5).create();
  }
  console.log('Clinic connection fingerprint: ' + digest);
  syncMeetRooms();
}

function clinicRequest(method, data) {
  const properties = PropertiesService.getScriptProperties();
  const response = UrlFetchApp.fetch('https://ftatmcyrmeyhghgckvbj.supabase.co/rest/v1/rpc/' + method, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: {apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YXRtY3lybWV5aGdoZ2NrdmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MjkyMDYsImV4cCI6MjA4MjIwNTIwNn0.OxMi2u-61P4-6C6KxBA6OST9PNjQaCIEvvpDKwgInns'},
    payload: JSON.stringify(Object.assign({p_key: properties.getProperty('bridgeKey')}, data)),
  });
  if (response.getResponseCode() >= 300) throw new Error('Clinic request failed: ' + response.getResponseCode());
  return JSON.parse(response.getContentText() || 'null');
}

function syncMeetRooms() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const jobs = clinicRequest('pending_meet_rooms', {});
    for (const job of jobs) {
      const eventId = job.id.replace(/-/g, '');
      let event;
      try {
        event = Calendar.Events.get('primary', eventId);
      } catch (error) {
        if (!/not found|404/i.test(error.message)) throw error;
        const end = new Date(Date.parse(job.scheduled_at) + job.duration_minutes * 60000);
        event = Calendar.Events.insert({
          id: eventId, summary: 'תור טלפוני במרפאה', visibility: 'private',
          transparency: 'transparent', reminders: {useDefault: false},
          start: {dateTime: job.scheduled_at}, end: {dateTime: end.toISOString()},
          conferenceData: {createRequest: {requestId: eventId, conferenceSolutionKey: {type: 'hangoutsMeet'}}},
        }, 'primary', {conferenceDataVersion: 1, sendUpdates: 'none'});
      }
      if (event.hangoutLink) clinicRequest('attach_meet_room', {p_visit: job.id, p_url: event.hangoutLink});
    }
  } finally {
    lock.releaseLock();
  }
}
