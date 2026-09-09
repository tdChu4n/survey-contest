// ═══════════════════════════════════════════════════════════════════
//  Anonymous Survey System — Google Apps Script
// ═══════════════════════════════════════════════════════════════════

const SPREADSHEET_ID    = PropertiesService.getScriptProperties().getProperty('ANONYMIZED_SPREADSHEET_ID');
const SHEET_ASSIGNMENTS = 'Activities';
const SHEET_RESPONSES   = 'SurveyResponses';
const SHEET_MAILBOX     = 'ListeningMailbox';
const SHEET_SPECIAL     = 'SpecialSurveyResponses';
const SPECIAL_SURVEY_NAME = 'Khảo sát nhu cầu, sở thích và các yếu tố ảnh hưởng đến ý định tham gia hoạt động của người học.';

// Cấu trúc sheet "Activities" (admin quản lý):
// A: courseName      — tên chương trình
// B: participants    — số lượng tham gia
// C: (không dùng - trước đây là locked)
// D: loaiHoatDong   — mã loại hoạt động (1 / 2 / 3)
// E: quyMo           — quy mô (3 / 4)
// F: donViToChuc     — đơn vị tổ chức
// G: donViPhoiHop    — đơn vị phối hợp
// H: ngayBatDau      — ngày bắt đầu (yyyy-mm-dd) → năm được tự lấy từ cột này
// I: ngayKetThuc     — ngày kết thúc (yyyy-mm-dd)
// J: batDauKhaoSat   — bắt đầu khảo sát (yyyy-mm-dd)
// K: ketThucKhaoSat  — kết thúc khảo sát (yyyy-mm-dd)

// Cấu trúc sheet "SurveyResponses" (tự động tạo nếu chưa có):
// timestamp | anonymousId | year | program | reserved fields | cohort | group | gender |
// DVTT1-4 | CLCT1-5 | CSVC1-3 | GTCT1-2 | SHL1-3 | LTT1-4 |
// overall | learn | trouble | interest | feedback


// ── Web App entry point ──────────────────────────────────────────
function doGet(e) {
  if (!SPREADSHEET_ID) return jsonOut({ success: false, error: 'Chưa cấu hình ANONYMIZED_SPREADSHEET_ID cho bản dự thi.' });
  const action = e.parameter.action;
  if (action === 'getCourses')    return handleGetCourses(e.parameter.email);
  if (action === 'submitSurvey')  return handleSubmitSurvey(e.parameter);
  if (action === 'getResponses')  return handleGetResponses();
  if (action === 'submitMailbox') return handleSubmitMailbox(e.parameter);
  if (action === 'getMailbox')    return handleGetMailbox();
  if (action === 'getStats')      return handleGetStats();
  if (action === 'addActivity')   return handleAddActivity(e.parameter);
  return jsonOut({ error: 'Unknown action' });
}


// ── Lấy danh sách chương trình + trạng thái của user ────────────
function handleGetCourses(email) {
  if (!email) return jsonOut({ success: false, courses: [] });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const assignSheet = ss.getSheetByName(SHEET_ASSIGNMENTS);
  if (!assignSheet) return jsonOut({ success: true, courses: [] });
  const aRows = assignSheet.getDataRange().getValues();

  const respSheet = ss.getSheetByName(SHEET_RESPONSES);
  const completed = new Set();
  const norm = email.trim().toLowerCase();
  if (respSheet) {
    const respRows = respSheet.getDataRange().getValues();
    for (let i = 0; i < respRows.length; i++) {
      const rowEmail = String(respRows[i][1]).trim();
      if (!rowEmail) continue;
      if (rowEmail.toLowerCase() === norm) completed.add(String(respRows[i][3]).trim());
    }
  }

  const completedCELG = new Set();
  const celgSheet = ss.getSheetByName(SHEET_SPECIAL);
  if (celgSheet) {
    const celgRows = celgSheet.getDataRange().getValues();
    for (let i = 1; i < celgRows.length; i++) {
      if (String(celgRows[i][1]).trim().toLowerCase() === norm) {
        completedCELG.add(SPECIAL_SURVEY_NAME);
      }
    }
  }

  const courses = [];
  for (let i = 1; i < aRows.length; i++) {
    const courseName = aRows[i][0];
    if (!courseName) continue;
    const name   = String(courseName).trim();
    
    // Tự động khoá theo ngày hạn chót khảo sát (Cột K, index 10)
    let locked = false;
    const deadlineVal = aRows[i][10];
    if (deadlineVal) {
      const deadlineDate = new Date(deadlineVal);
      if (!isNaN(deadlineDate.getTime())) {
        // Hạn chót kéo dài hết ngày ghi trong ô khảo sát (đến 23:59:59)
        deadlineDate.setHours(23, 59, 59, 999);
        if (new Date() > deadlineDate) {
          locked = true;
        }
      }
    }
    
    const year   = aRows[i][7] ? new Date(aRows[i][7]).getFullYear() : '';
    courses.push({
      rowIndex:       i + 1,
      year:           String(year),
      courseName:     name,
      locked,
      status:         completed.has(name) ? 'Đã thực hiện' : (locked ? 'Đã khoá' : 'Chưa thực hiện'),
      loaiHoatDong:   String(aRows[i][3] || '').trim(),
      quyMo:          String(aRows[i][4] || '').trim(),
      donViToChuc:    String(aRows[i][5] || '').trim(),
      donViPhoiHop:   String(aRows[i][6] || '').trim(),
      ngayBatDau:     fmtDateOnly(aRows[i][7]),
      ngayKetThuc:    fmtDateOnly(aRows[i][8]),
      batDauKhaoSat:  fmtDateOnly(aRows[i][9]),
      ketThucKhaoSat: fmtDateOnly(aRows[i][10]),
    });
  }

  courses.push({
    rowIndex:       -1,
    year:           String(new Date().getFullYear()),
    courseName:     SPECIAL_SURVEY_NAME,
    locked:         false,
    status:         completedCELG.has(SPECIAL_SURVEY_NAME) ? 'Đã thực hiện' : 'Chưa thực hiện',
    loaiHoatDong:   'Khảo sát đặc biệt',
    quyMo:          '', donViToChuc: '', donViPhoiHop: '',
    ngayBatDau:     '', ngayKetThuc: '', batDauKhaoSat: '',
    ketThucKhaoSat: 'Không thời hạn',
  });

  return jsonOut({ success: true, courses });
}


// ── Lưu phản hồi khảo sát ───────────────────────────────────────
function handleSubmitSurvey(p) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (p.program === SPECIAL_SURVEY_NAME) {
      let celgSheet = ss.getSheetByName(SHEET_SPECIAL);
      if (!celgSheet) {
        celgSheet = ss.insertSheet(SHEET_SPECIAL);
        celgSheet.appendRow([
          'Dấu thời gian','Mã ẩn danh','Năm','Chương trình',
          'Trường dự phòng 1','Trường dự phòng 2','Trường dự phòng 3','Trường dự phòng 4','Nhóm năm học','Nhóm ngành',
          'Giới tính','Trường dự phòng 5','Trường dự phòng 6','Trường dự phòng 7','Trường dự phòng 8',
          'Số HĐ tham gia', 'Quan tâm HĐ', 'Ưu tiên HĐ', 'Hình thức HĐ',
          'C.1', 'C.2', 'C.3', 'C.4', 'C.5', 'C.6', 'C.7',
          'D.1', 'D.2', 'D.3', 'D.4', 'D.5',
          'Rào cản tham gia', 'Rào cản lớn nhất',
          'Hình thức tổ chức', 'Khung thời gian', 'Sẵn sàng dành thời gian',
          'Nên tổ chức HĐ nào', 'Thay đổi một điều'
        ]);
      }
      celgSheet.appendRow([
        new Date(), p.email||'', p.year||'', p.program||'',
        '', '', '', '', p.cohort||'', p.faculty||'',
        p.gender||'', '', '', '', '',
        p.Q_A8||'', p.Q_B1||'', p.Q_B2||'', p.Q_B3||'',
        num(p.C_1), num(p.C_2), num(p.C_3), num(p.C_4), num(p.C_5), num(p.C_6), num(p.C_7),
        p.D_1||'', p.D_2||'', p.D_3||'', p.D_4||'', p.D_5||'',
        p.Q_E1||'', p.Q_E2||'',
        p.Q_F1||'', p.Q_F2||'', p.Q_F3||'',
        p.Q_G1||'', p.Q_G2||''
      ]);
      return jsonOut({ success: true });
    }

    
    // Kiểm tra xem chương trình đã quá hạn khảo sát chưa trước khi lưu
    const assignSheet = ss.getSheetByName(SHEET_ASSIGNMENTS);
    let matchedActivity = false;
    if (assignSheet) {
      const aRows = assignSheet.getDataRange().getValues();
      for (let i = 1; i < aRows.length; i++) {
        if (String(aRows[i][0]).trim() === String(p.program).trim()) {
          matchedActivity = true;
          const deadlineVal = aRows[i][10];
          if (deadlineVal) {
            const deadlineDate = new Date(deadlineVal);
            if (!isNaN(deadlineDate.getTime())) {
              deadlineDate.setHours(23, 59, 59, 999);
              if (new Date() > deadlineDate) {
                return jsonOut({ success: false, error: 'Khảo sát đã đóng do quá hạn chót.' });
              }
            }
          }
          break;
        }
      }
    }
    if (!matchedActivity) {
      return jsonOut({ success: false, error: 'Hoạt động không tồn tại trong bản dự thi.' });
    }

    let respSheet = ss.getSheetByName(SHEET_RESPONSES);
    if (!respSheet) {
      respSheet = ss.insertSheet(SHEET_RESPONSES);
      respSheet.appendRow([
        'Dấu thời gian','Mã ẩn danh','Năm','Chương trình',
        'Trường dự phòng 1','Trường dự phòng 2','Trường dự phòng 3','Trường dự phòng 4','Nhóm năm học','Nhóm ngành',
        'Giới tính','Trường dự phòng 5','Trường dự phòng 6','Trường dự phòng 7','Trường dự phòng 8',
        'DVTT1','DVTT2','DVTT3','DVTT4',
        'CLCT1','CLCT2','CLCT3','CLCT4','CLCT5',
        'CSVC1','CSVC2','CSVC3','GTCT1','GTCT2',
        'SHL1','SHL2','SHL3','LTT1','LTT2','LTT3','LTT4',
        'Tổng quan','Bài học/Giá trị áp dụng',
        'Khó khăn/Trải nghiệm chưa thoải mái','Mối quan tâm','Góp ý'
      ]);
    }
    const existingRows = respSheet.getDataRange().getValues();
    const anonymousId = String(p.email || '').trim().toLowerCase();
    const programName = String(p.program || '').trim();
    for (let i = 1; i < existingRows.length; i++) {
      if (String(existingRows[i][1] || '').trim().toLowerCase() === anonymousId &&
          String(existingRows[i][3] || '').trim() === programName) {
        return jsonOut({ success: false, error: 'Phiếu khảo sát cho hoạt động này đã được ghi nhận.' });
      }
    }
    respSheet.appendRow([
      new Date(), p.email||'', p.year||'', p.program||'',
      '', '', '', '', p.cohort||'', p.faculty||'',
      p.gender||'', '', '', '', '',
      num(p.DVTT1),num(p.DVTT2),num(p.DVTT3),num(p.DVTT4),
      num(p.CLCT1),num(p.CLCT2),num(p.CLCT3),num(p.CLCT4),num(p.CLCT5),
      num(p.CSVC1),num(p.CSVC2),num(p.CSVC3),
      num(p.GTCT1),num(p.GTCT2),
      num(p.SHL1),num(p.SHL2),num(p.SHL3),
      num(p.LTT1),num(p.LTT2),num(p.LTT3),num(p.LTT4),
      num(p.overall), p.learn||'', p.trouble||'', p.interest||'', p.feedback||'',
    ]);
    return jsonOut({ success: true });
  } catch (err) {
    Logger.log('handleSubmitSurvey error: ' + err.message);
    return jsonOut({ success: false, error: err.message });
  }
}


// ── Trả toàn bộ dữ liệu phản hồi cho admin dashboard ───────────
function handleGetResponses() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_RESPONSES);
  if (!sheet) return jsonOut({ success: true, responses: [] });

  const rows      = sheet.getDataRange().getValues();
  const responses = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[1]||'').trim()) continue;
    responses.push({
      id: 'R'+String(i).padStart(3,'0'), ts: fmtDate(r[0]),
      email: String(r[1]||''), year: String(r[2]||''),
      program: String(r[3]||''), 
      lastName: '', firstName: '', studentId: '', studentClass: '',
      cohort: String(r[8]||''), faculty: String(r[9]||''), gender: String(r[10]||''),
      phone: '', institutionalEmail: '', emailOther: '', facebook: '',
      DVTT1:num(r[15]),DVTT2:num(r[16]),DVTT3:num(r[17]),DVTT4:num(r[18]),
      CLCT1:num(r[19]),CLCT2:num(r[20]),CLCT3:num(r[21]),CLCT4:num(r[22]),CLCT5:num(r[23]),
      CSVC1:num(r[24]),CSVC2:num(r[25]),CSVC3:num(r[26]),
      GTCT1:num(r[27]),GTCT2:num(r[28]),
      SHL1:num(r[29]),SHL2:num(r[30]),SHL3:num(r[31]),
      LTT1:num(r[32]),LTT2:num(r[33]),LTT3:num(r[34]),LTT4:num(r[35]),
      overall:num(r[36]), learn:String(r[37]||''), trouble:String(r[38]||''),
      interest:String(r[39]||''), feedback:String(r[40]||''),
    });
  }

  // Đọc Activities: A=courseName, B=participants, C=locked,
  // D=loai, E=quyMo, F=donViTC, G=donViPH, H=ngayBD, I=ngayKT, J=bdKS, K=ktKS
  const assignSheet    = ss.getSheetByName(SHEET_ASSIGNMENTS);
  const programs       = [];
  const participantMap = {};
  const programYears   = {};
  const programInfo    = {};

  if (assignSheet) {
    const aRows = assignSheet.getDataRange().getValues();
    for (let i = 1; i < aRows.length; i++) {
      if (!aRows[i][0]) continue;
      const name = String(aRows[i][0]).trim();
      programs.push(name);

      const n = parseInt(aRows[i][1]);
      if (!isNaN(n)) participantMap[name] = n;

      // Lấy năm từ ngayBatDau (cột H, index 7)
      const y = aRows[i][7] ? new Date(aRows[i][7]).getFullYear() : new Date().getFullYear();
      programYears[name] = isNaN(y) ? new Date().getFullYear() : y;

      programInfo[name] = {
        loaiHoatDong:   String(aRows[i][3] || '').trim(),
        quyMo:          String(aRows[i][4] || '').trim(),
        donViToChuc:    String(aRows[i][5] || '').trim(),
        donViPhoiHop:   String(aRows[i][6] || '').trim(),
        ngayBatDau:     fmtDateOnly(aRows[i][7]),
        ngayKetThuc:    fmtDateOnly(aRows[i][8]),
        batDauKhaoSat:  fmtDateOnly(aRows[i][9]),
        ketThucKhaoSat: fmtDateOnly(aRows[i][10]),
      };
    }
  }

  return jsonOut({ success: true, responses, programs, participantMap, programYears, programInfo });
}


// ── Hòm thư lắng nghe thanh niên ────────────────────────────────
function handleSubmitMailbox(p) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_MAILBOX);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_MAILBOX);
      sheet.appendRow(['Dấu thời gian', 'Mã ẩn danh', 'Nội dung']);
    }
    sheet.appendRow([new Date(), String(p.email || '(ẩn danh)'), String(p.content || '')]);
    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, error: err.message });
  }
}

function handleGetMailbox() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_MAILBOX);
  if (!sheet) return jsonOut({ success: true, entries: [] });

  const rows    = sheet.getDataRange().getValues();
  const entries = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[2] || '').trim()) continue;
    entries.push({
      ts:      fmtDate(r[0]),
      email:   String(r[1] || ''),
      content: String(r[2] || ''),
    });
  }
  entries.reverse(); // mới nhất lên đầu
  return jsonOut({ success: true, entries });
}


// ── Thống kê tổng hợp công khai ─────────────────────────────────
function handleGetStats() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Từ sheet SurveyResponses
  const respSheet = ss.getSheetByName(SHEET_RESPONSES);
  let totalResponses = 0;
  let totalScore = 0;
  let scoreCount = 0;
  const programsWithResp = new Set();
  const faculties = new Set();

  if (respSheet) {
    const rows = respSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (!String(rows[i][1] || '').trim()) continue;
      totalResponses++;
      if (rows[i][3]) programsWithResp.add(String(rows[i][3]).trim());
      if (rows[i][9]) faculties.add(String(rows[i][9]).trim());
      const overall = parseFloat(rows[i][36]);
      if (!isNaN(overall) && overall >= 1) { totalScore += overall; scoreCount++; }
    }
  }

  // Từ sheet Activities — đếm tổng participants và tổng sự kiện
  const assignSheet = ss.getSheetByName(SHEET_ASSIGNMENTS);
  let totalParticipants = 0;
  let totalPrograms = 0;
  if (assignSheet) {
    const aRows = assignSheet.getDataRange().getValues();
    for (let i = 1; i < aRows.length; i++) {
      if (!aRows[i][0]) continue;
      totalPrograms++;
      const n = parseInt(aRows[i][1]);
      if (!isNaN(n)) totalParticipants += n;
    }
  }

  const avgScore   = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : '—';
  const completion = totalParticipants > 0 ? Math.round(totalResponses / totalParticipants * 100) : 0;

  return jsonOut({
    success: true,
    totalResponses,
    totalPrograms,
    programsCount:   programsWithResp.size,
    completionRate:  completion,
    avgScore,
    facultiesCount:  faculties.size,
  });
}

// ── Thêm hoạt động mới vào sheet Activities ───────────────────────
function handleAddActivity(p) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let assignSheet = ss.getSheetByName(SHEET_ASSIGNMENTS);
    if (!assignSheet) {
      assignSheet = ss.insertSheet(SHEET_ASSIGNMENTS);
      assignSheet.appendRow([
        'courseName','participants','reserved','loaiHoatDong','quyMo','donViToChuc','donViPhoiHop',
        'ngayBatDau','ngayKetThuc','batDauKhaoSat','ketThucKhaoSat','tongKinhPhi',
        'soLieuKhacTen','soLieuKhacSl','linkVanBan','linkMinhChung','tomTatHd','danhGiaHieuQua'
      ]);
    }
    
    // Kiểm tra xem tên chương trình đã tồn tại chưa để tránh trùng lặp
    const aRows = assignSheet.getDataRange().getValues();
    const newName = String(p.courseName || '').trim();
    if (!newName) {
      return jsonOut({ success: false, error: 'Tên hoạt động không được để trống.' });
    }
    const participants = parseInt(p.participants, 10);
    if (isNaN(participants) || participants < 1) {
      return jsonOut({ success: false, error: 'Số lượng tham gia phải là số nguyên dương.' });
    }
    if (!String(p.loaiHoatDong || '').trim() || !String(p.quyMo || '').trim()) {
      return jsonOut({ success: false, error: 'Loại và quy mô hoạt động không được để trống.' });
    }
    for (let i = 1; i < aRows.length; i++) {
      if (String(aRows[i][0]).trim().toLowerCase() === newName.toLowerCase()) {
        return jsonOut({ success: false, error: 'Tên hoạt động đã tồn tại.' });
      }
    }
    
    const parseDate = (val) => {
      if (!val) return '';
      const d = new Date(val);
      return isNaN(d.getTime()) ? val : d;
    };
    
    // Thêm hàng mới vào Activities
    // A: courseName, B: participants, C: locked (trống), D: loaiHoatDong, E: quyMo, F: donViToChuc, G: donViPhoiHop, H: ngayBatDau, I: ngayKetThuc, J: batDauKhaoSat, K: ketThucKhaoSat, L: tongKinhPhi, M: soLieuKhacTen, N: soLieuKhacSl, O: linkVanBan, P: linkMinhChung, Q: tomTatHd, R: danhGiaHieuQua
    assignSheet.appendRow([
      newName,
      participants,
      '', // C: locked (trống)
      p.loaiHoatDong || '',
      p.quyMo || '',
      p.donViToChuc || '',
      p.donViPhoiHop || '',
      parseDate(p.ngayBatDau),
      parseDate(p.ngayKetThuc),
      parseDate(p.batDauKhaoSat),
      parseDate(p.ketThucKhaoSat),
      parseInt(p.tongKinhPhi || 0),
      p.soLieuKhacTen || '',
      parseInt(p.soLieuKhacSl || 0),
      p.linkVanBan || '',
      p.linkMinhChung || '',
      p.tomTatHd || '',
      p.danhGiaHieuQua || ''
    ]);
    
    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, error: err.message });
  }
}

// ── Đồng bộ thủ công từ hệ thống nguồn sang bản dự thi ───────────
// Chạy hàm này trong Apps Script Editor. Không mở thành API công khai.
// Script Properties cần có:
//   SOURCE_SPREADSHEET_ID, ANONYMIZED_SPREADSHEET_ID, ANONYMIZATION_SALT
function syncAnonymizedSnapshot() {
  const props = PropertiesService.getScriptProperties();
  const sourceId = props.getProperty('SOURCE_SPREADSHEET_ID');
  const targetId = props.getProperty('ANONYMIZED_SPREADSHEET_ID');
  const salt = props.getProperty('ANONYMIZATION_SALT');
  if (!sourceId || !targetId || !salt) {
    throw new Error('Thiếu SOURCE_SPREADSHEET_ID, ANONYMIZED_SPREADSHEET_ID hoặc ANONYMIZATION_SALT.');
  }
  if (sourceId === targetId) throw new Error('Nguồn và đích phải là hai bảng tính khác nhau.');

  const source = SpreadsheetApp.openById(sourceId);
  const target = SpreadsheetApp.openById(targetId);
  const sourceActivities = source.getSheetByName('Assignments');
  const sourceResponses = source.getSheetByName('Responses');
  if (!sourceActivities || !sourceResponses) throw new Error('Không tìm thấy sheet nguồn cần đồng bộ.');

  const activityRows = sourceActivities.getDataRange().getValues();
  const programMap = {};
  const unitMap = {};
  let nextUnit = 0;
  const anonymizeUnit = value => {
    const key = String(value || '').trim();
    if (!key) return '';
    if (!unitMap[key]) unitMap[key] = 'Đơn vị ' + String.fromCharCode(65 + (nextUnit++ % 26));
    return unitMap[key];
  };

  const cleanActivities = [[
    'courseName','participants','reserved','loaiHoatDong','quyMo','donViToChuc','donViPhoiHop',
    'ngayBatDau','ngayKetThuc','batDauKhaoSat','ketThucKhaoSat','tongKinhPhi',
    'soLieuKhacTen','soLieuKhacSl','linkVanBan','linkMinhChung','tomTatHd','danhGiaHieuQua'
  ]];
  for (let i = 1; i < activityRows.length; i++) {
    if (!activityRows[i][0]) continue;
    const anonymousName = 'Hoạt động ' + String(cleanActivities.length).padStart(2, '0');
    programMap[String(activityRows[i][0]).trim()] = anonymousName;
    cleanActivities.push([
      anonymousName, activityRows[i][1] || 0, '', activityRows[i][3] || '', activityRows[i][4] || '',
      anonymizeUnit(activityRows[i][5]), anonymizeUnit(activityRows[i][6]),
      activityRows[i][7] || '', activityRows[i][8] || '', activityRows[i][9] || '', activityRows[i][10] || '',
      activityRows[i][11] || 0, '', activityRows[i][13] || 0, '', '', '', ''
    ]);
  }

  const responseRows = sourceResponses.getDataRange().getValues();
  const cleanResponses = [[
    'Dấu thời gian','Mã ẩn danh','Năm','Chương trình',
    'Trường dự phòng 1','Trường dự phòng 2','Trường dự phòng 3','Trường dự phòng 4','Nhóm năm học','Nhóm ngành',
    'Giới tính','Trường dự phòng 5','Trường dự phòng 6','Trường dự phòng 7','Trường dự phòng 8',
    'DVTT1','DVTT2','DVTT3','DVTT4','CLCT1','CLCT2','CLCT3','CLCT4','CLCT5',
    'CSVC1','CSVC2','CSVC3','GTCT1','GTCT2','SHL1','SHL2','SHL3','LTT1','LTT2','LTT3','LTT4',
    'Tổng quan','Bài học/Giá trị áp dụng','Khó khăn','Mối quan tâm','Góp ý'
  ]];
  const cohortMap = {};
  const groupMap = {};
  for (let i = 1; i < responseRows.length; i++) {
    const row = responseRows[i];
    if (!String(row[1] || '').trim()) continue;
    const sourceProgram = String(row[3] || '').trim();
    if (!programMap[sourceProgram]) continue;
    const cohortKey = String(row[8] || '').trim();
    const groupKey = String(row[9] || '').trim();
    if (cohortKey && !cohortMap[cohortKey]) cohortMap[cohortKey] = 'Nhóm năm học ' + (Object.keys(cohortMap).length + 1);
    if (groupKey && !groupMap[groupKey]) groupMap[groupKey] = 'Nhóm ngành ' + String.fromCharCode(65 + (Object.keys(groupMap).length % 26));
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + String(row[1]).toLowerCase());
    const anonymousId = 'P-' + digest.slice(0, 12).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
    cleanResponses.push([
      row[0], anonymousId, row[2] || '', programMap[sourceProgram],
      '', '', '', '', cohortMap[cohortKey] || '', groupMap[groupKey] || '', row[10] || '', '', '', '', '',
      ...row.slice(15, 37), '', '', '', ''
    ]);
  }

  replaceSheetData_(target, SHEET_ASSIGNMENTS, cleanActivities);
  replaceSheetData_(target, SHEET_RESPONSES, cleanResponses);
  return { activities: cleanActivities.length - 1, responses: cleanResponses.length - 1 };
}

function replaceSheetData_(spreadsheet, sheetName, rows) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  sheet.clearContents();
  if (rows.length) sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}


// ── Helpers ──────────────────────────────────────────────────────
function num(v) { const n = parseInt(v); return isNaN(n) ? '' : n; }

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const pad = n => String(n).padStart(2,'0');
  return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function fmtDateOnly(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).trim();
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
