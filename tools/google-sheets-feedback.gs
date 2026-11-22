/* B01 simulator: receives visitor sessions and ratings into this Google Sheet,
   and returns them to the simulator's hidden admin panel.

   Setup, once (steps in Arabic in the README):
   1. In the Google Sheet: Extensions > Apps Script. Replace the default code with this file.
   2. Change SECRET below to your own private password. Do not share it.
   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy and allow access.
   4. Copy the Web app URL. In the simulator's admin panel, settings: paste the URL and the same SECRET.

   "Anyone" can reach the URL, but nothing is saved or returned without the SECRET.
   After editing this script later: Deploy > Manage deployments > edit > New version. */

const SECRET = 'CHANGE-THIS-SECRET';
const SHEET_NAME = 'التقييمات';

/* the simulator sends these fields; the second value is the column header in the sheet */
const COLS = [
  ['id', 'المعرّف'], ['visitor', 'الآيدي'], ['role', 'الصفة'], ['stars', 'التقييم (من 5)'], ['review', 'الملاحظة'],
  ['start', 'البداية'], ['end', 'النهاية'], ['duration_s', 'المدة (ثانية)'], ['missions', 'عدد المهمات'], ['score', 'النقاط'],
  ['coverage', 'التغطية %'], ['correct', 'قرارات صحيحة (من 4)'], ['mine', 'اللغم المربوط'], ['wreck', 'الحطام'],
  ['unknown', 'الجسم غير المعروف'], ['fish', 'الأسماك'], ['time_mode', 'مدة المهمة'], ['device', 'الجهاز'], ['lang', 'اللغة'],
  ['status', 'الحالة'], ['saved_at', 'وقت الاستلام']
];
/* kept as plain text so IDs like 007 and times are not turned into numbers or dates */
const TEXT_COLS = ['id', 'visitor', 'role', 'review', 'start', 'end', 'mine', 'wreck', 'unknown', 'fish', 'time_mode', 'device', 'lang', 'status'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS.map(c => c[1])]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    COLS.forEach((c, i) => {
      if (TEXT_COLS.indexOf(c[0]) >= 0) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
    });
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* text that starts like a formula is stored as text, never run */
function clean_(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  v = String(v).slice(0, 1000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

/* save sessions: a session already in the sheet (same id) is updated, a new one is added */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad request' }); }
  if (!body || body.key !== SECRET) return json_({ ok: false, error: 'unauthorized' });
  const records = Array.isArray(body.records) ? body.records : [];
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_();
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const saved = [];
    records.forEach(r => {
      if (!r || !r.id) return;
      const row = COLS.map(c => (c[0] === 'saved_at' ? new Date() : clean_(r[c[0]])));
      const i = ids.indexOf(String(r.id));
      if (i >= 0) sh.getRange(i + 2, 1, 1, COLS.length).setValues([row]);
      else { sh.appendRow(row); ids.push(String(r.id)); }
      saved.push(String(r.id));
    });
    return json_({ ok: true, saved: saved });
  } finally {
    lock.releaseLock();
  }
}

/* read all sessions for the admin panel ("all devices") */
function doGet(e) {
  if (!e || !e.parameter || e.parameter.key !== SECRET) return json_({ ok: false, error: 'unauthorized' });
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return json_({ ok: true, records: [] });
  const tz = Session.getScriptTimeZone();
  const values = sh.getRange(2, 1, last - 1, COLS.length).getValues();
  const records = values.map(v => {
    const o = {};
    COLS.forEach((c, i) => {
      let x = v[i];
      if (x instanceof Date) x = Utilities.formatDate(x, tz, 'yyyy-MM-dd HH:mm:ss');
      if (typeof x === 'string' && x.charAt(0) === "'") x = x.slice(1);
      o[c[0]] = x;
    });
    return o;
  });
  return json_({ ok: true, records: records });
}
