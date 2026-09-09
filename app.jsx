/* app.jsx — main shell, program sidebar, footer */

const { useState, useMemo, useEffect } = React;

// ── Live data từ Google Sheets ────────────────────────
const APPS_SCRIPT_URL = window.CONTEST_CONFIG.appsScriptUrl;
// ─────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="contest-footer admin-contest-footer">
      <div className="contest-footer__inner">
        <div><h3>VỀ HỆ THỐNG</h3><p>Nền tảng khảo sát và đánh giá chất lượng hoạt động dành cho môi trường giáo dục.</p></div>
        <div><h3>CHỨC NĂNG</h3><ul><li>Quản lý hoạt động</li><li>Báo cáo khảo sát</li><li>Tổng hợp ý kiến</li></ul></div>
        <div><h3>CHẾ ĐỘ ẨN DANH</h3><p>Thông tin nhận diện đơn vị và dữ liệu cá nhân không được công bố trong phiên bản này.</p></div>
      </div>
      <div className="contest-footer__bottom"><span>© 2026 Trường X. Bản trình diễn ẩn danh.</span><span>Lắng nghe • Thấu hiểu • Cải tiến</span></div>
    </footer>
  );
}

// ── Sidebar chọn chương trình (2 tầng: năm → hoạt động) ─
function ProgramSidebar({ selectedPrograms, onToggle, onBatchSet, onHomeClick }) {
  const allPrograms = window.PROGRAMS || [];
  const yearMap = window.PROGRAM_YEARS || {};

  // Nhóm chương trình theo năm
  const byYear = {};
  for (const p of allPrograms) {
    const y = String(yearMap[p] || "Khác");
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(p);
  }
  const allYears = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  // Tầng 1: năm nào đang được hiển thị (mặc định = chưa chọn năm nào)
  const [visibleYears, setVisibleYears] = useState(() => new Set());

  const toggleVisibleYear = (year) => {
    const willShow = !visibleYears.has(year);
    setVisibleYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year); else next.add(year);
      return next;
    });
    // Khi hiện năm → tự chọn hết chương trình của năm đó
    // Khi ẩn năm → tự bỏ chọn hết chương trình của năm đó
    onBatchSet(byYear[year] || [], willShow);
  };

  // Chương trình hiển thị = chỉ những năm đang được tick
  const visiblePrograms = allPrograms.filter(p =>
    visibleYears.has(String(yearMap[p] || "Khác"))
  );

  return (
    <aside className="sidebar">
      <div className="sidebar__head">
        {onHomeClick && (
          <div style={{ marginBottom: 15, fontSize: 13, color: '#006b5e', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }} onClick={onHomeClick}>
            <span style={{ fontSize: 16 }}>←</span> Quay lại
          </div>
        )}
        <span className="sidebar__title">Chương trình</span>
        <div className="sidebar__btns">
          <button className="sidebar__btn"
            onClick={() => onBatchSet(visiblePrograms, true)}>Chọn hết</button>
          <button className="sidebar__btn sidebar__btn--clear"
            onClick={() => onBatchSet(visiblePrograms, false)}>Xóa hết</button>
        </div>
      </div>

      {/* Tầng 1: chọn năm */}
      <div className="sidebar__year-section">
        <div className="sidebar__section-label">Chọn năm</div>
        <div className="sidebar__year-chips">
          {allYears.map(year => {
            const on = visibleYears.has(year);
            return (
              <label key={year} className={"sidebar__year-chip" + (on ? " sidebar__year-chip--on" : "")}>
                <input type="checkbox" checked={on} onChange={() => toggleVisibleYear(year)} />
                {year}
              </label>
            );
          })}
        </div>
      </div>

      {/* Tầng 2: chọn từng hoạt động */}
      <div className="sidebar__body">
        {visiblePrograms.length === 0 ? (
          <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
            Chọn năm để xem hoạt động
          </div>
        ) : visiblePrograms.map(p => {
          const checked = selectedPrograms.has(p);
          return (
            <label key={p} className={"sidebar__item" + (checked ? " sidebar__item--on" : "")}>
              <input type="checkbox" checked={checked} onChange={() => onToggle(p)} />
              <span className="sidebar__item-name">{p}</span>
            </label>
          );
        })}
      </div>

      <div className="sidebar__foot">
        {selectedPrograms.size}/{allPrograms.length} chương trình
      </div>
    </aside>
  );
}

// ── Báo cáo sau chương trình (tabs + bộ lọc khóa/khoa) ─
function ReportTabs({ responses }) {
  const tabs = [
    { id: "__SUMMARY__", label: "Tổng hợp", icon: Icon.ChartBar },
    ...FACTORS.map(f => ({ id: f.code, label: f.name })),
    { id: "__QUAL__", label: "Phản hồi mở", icon: Icon.Notes },
  ];
  const [active, setActive] = useState(() => {
    return localStorage.getItem("mymy.tab") || "__SUMMARY__";
  });
  useEffect(() => { localStorage.setItem("mymy.tab", active); }, [active]);

  const [cohortFilter, setCohortFilter] = useState("__ALL__");
  const [facultyFilter, setFacultyFilter] = useState("__ALL__");

  const availableCohorts = useMemo(() =>
    ["49", "50", "51"].filter(k => responses.some(r => r.cohort === k)),
    [responses]
  );
  const availableFaculties = useMemo(() =>
    [...new Set(responses.map(r => r.faculty).filter(Boolean))].sort(),
    [responses]
  );

  const filtered = useMemo(() => {
    let r = responses;
    if (cohortFilter !== "__ALL__") r = r.filter(x => x.cohort === cohortFilter);
    if (facultyFilter !== "__ALL__") r = r.filter(x => x.faculty === facultyFilter);
    return r;
  }, [responses, cohortFilter, facultyFilter]);

  const hasFilter = cohortFilter !== "__ALL__" || facultyFilter !== "__ALL__";

  return (
    <Section icon={Icon.Report} title="Báo cáo sau chương trình">

      {/* Bộ lọc khóa / khoa */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        marginBottom: 16, padding: "10px 14px",
        background: "var(--surface-soft,#f6f8fa)", borderRadius: 10,
        border: "1px solid var(--border,#e2e8f0)"
      }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>Lọc theo:</span>

        <select value={cohortFilter} onChange={e => setCohortFilter(e.target.value)}
          style={{
            fontFamily: "inherit", fontSize: 13,
            border: "1px solid #cbd5e1", borderRadius: 8,
            padding: "5px 10px", background: "#fff", cursor: "pointer"
          }}>
          <option value="__ALL__">— Tất cả khóa —</option>
          {availableCohorts.map(k => <option key={k} value={k}>Khóa {k}</option>)}
        </select>

        <select value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}
          style={{
            fontFamily: "inherit", fontSize: 13,
            border: "1px solid #cbd5e1", borderRadius: 8,
            padding: "5px 10px", background: "#fff", cursor: "pointer", maxWidth: 240
          }}>
          <option value="__ALL__">— Tất cả khoa —</option>
          {availableFaculties.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {hasFilter && (
          <button onClick={() => { setCohortFilter("__ALL__"); setFacultyFilter("__ALL__"); }}
            style={{
              fontSize: 12, color: "#dc2626", background: "#fef2f2",
              border: "1px solid #fca5a5", borderRadius: 6,
              padding: "4px 10px", cursor: "pointer"
            }}>
            ✕ Bỏ lọc
          </button>
        )}
        {hasFilter && (
          <span style={{ fontSize: 12, color: "#64748b" }}>
            — {filtered.length} / {responses.length} phiếu
          </span>
        )}
      </div>

      <div className="tabs">
        {tabs.map(t => {
          const Ico = t.icon;
          return (
            <button key={t.id}
              className={"tab" + (active === t.id ? " tab--active" : "")}
              onClick={() => setActive(t.id)}>
              {Ico ? <Ico style={{ width: 16, height: 16 }} /> : null}
              {t.label}
            </button>
          );
        })}
      </div>
      {(() => {
        if (active === "__SUMMARY__")
          return <SummaryTabContent responses={filtered} onFactorClick={setActive} />;
        if (active === "__QUAL__") return <QualitativeTabContent responses={filtered} />;
        const f = FACTORS.find(x => x.code === active);
        return f ? <FactorTabContent factor={f} responses={filtered} /> : null;
      })()}
    </Section>
  );
}

// ── Báo cáo tổng hợp hoạt động cơ sở ────────────────────────────
function ActivityReport({ onBack }) {
  const programs = window.PROGRAMS || [];
  const responses = window.SURVEY_RESPONSES || [];
  const participantMap = window.PARTICIPANT_MAP || {};
  const programInfo = window.PROGRAM_INFO || {};

  const rows = useMemo(() => programs.map(program => {
    const programResponses = responses.filter(r => r.program === program);
    const participants = Number(participantMap[program]) || 0;
    const scored = programResponses.map(r => Number(r.overall)).filter(v => Number.isFinite(v) && v > 0);
    const average = scored.length ? scored.reduce((sum, value) => sum + value, 0) / scored.length : 0;
    return {
      program,
      participants,
      responses: programResponses.length,
      completion: participants > 0 ? Math.min(100, Math.round(programResponses.length / participants * 100)) : 0,
      average,
      info: programInfo[program] || {},
    };
  }), [programs, responses, participantMap, programInfo]);

  const totals = rows.reduce((acc, row) => {
    acc.participants += row.participants;
    acc.responses += row.responses;
    return acc;
  }, { participants: 0, responses: 0 });
  const allScores = responses.map(r => Number(r.overall)).filter(v => Number.isFinite(v) && v > 0);
  const overallAverage = allScores.length ? allScores.reduce((sum, value) => sum + value, 0) / allScores.length : 0;
  const completion = totals.participants > 0 ? Math.min(100, Math.round(totals.responses / totals.participants * 100)) : 0;

  return (
    <div className="admin-subpage">
      <button className="admin-back-link" onClick={onBack}>← Quay lại</button>
      <div className="admin-subpage__heading">
        <div>
          <h1>Tổng hợp báo cáo hoạt động cơ sở</h1>
          <p>Số liệu tổng hợp đã loại bỏ thông tin nhận diện cá nhân và đơn vị.</p>
        </div>
      </div>

      <div className="activity-summary-grid">
        <div className="activity-summary-card"><span>Hoạt động</span><strong>{rows.length}</strong></div>
        <div className="activity-summary-card"><span>Người tham gia</span><strong>{totals.participants}</strong></div>
        <div className="activity-summary-card"><span>Phiếu phản hồi</span><strong>{totals.responses}</strong></div>
        <div className="activity-summary-card"><span>Tỷ lệ phản hồi</span><strong>{completion}%</strong></div>
        <div className="activity-summary-card"><span>Điểm trung bình</span><strong>{overallAverage ? overallAverage.toFixed(2) : '—'}</strong></div>
      </div>

      <Section icon={Icon.ChartBar} title="Chi tiết theo hoạt động">
        <div className="response-table-wrap">
          <table className="response-table activity-report-table">
            <thead>
              <tr><th>Hoạt động</th><th>Năm</th><th>Loại</th><th>Quy mô</th><th>Đơn vị</th><th>Tham gia</th><th>Phản hồi</th><th>Tỷ lệ</th><th>Điểm TB</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="empty-table-cell">Chưa có dữ liệu hoạt động.</td></tr>
              ) : rows.map(row => (
                <tr key={row.program}>
                  <td><strong>{row.program}</strong><small>{row.info.ngayBatDau || 'Chưa có ngày'}</small></td>
                  <td>{window.PROGRAM_YEARS?.[row.program] || '—'}</td>
                  <td>{row.info.loaiHoatDong || '—'}</td>
                  <td>{row.info.quyMo || '—'}</td>
                  <td>{row.info.donViToChuc || '—'}</td>
                  <td>{row.participants || '—'}</td>
                  <td>{row.responses}</td>
                  <td><span className="completion-pill">{row.completion}%</span></td>
                  <td>{row.average ? row.average.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ── Home Menu ──────────────────────────────────────────────
function HomeMenu({ onViewChange, onAddActivityClick }) {
  return (
    <div className="home-menu">
      <div className="admin-page-heading">
        <div><span>TRƯỜNG X</span> — HỆ THỐNG KHẢO SÁT</div>
        <small>Không gian quản trị và phân tích dữ liệu hoạt động</small>
      </div>

      <div className="home-menu__section">
        <div className="home-menu__header">Quản lý hoạt động</div>
        <div className="home-menu__cards">
          <div className="home-menu__card card-orange" onClick={onAddActivityClick}>
            <div className="home-menu__icon-wrap icon-orange">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><path d="M9 6h10M9 12h7M5 18h6"/><circle cx="18" cy="18" r="4"/><path d="M18 16v4M16 18h4"/></svg>
            </div>
            <h3 className="home-menu__card-title">Thêm khảo sát hoạt động</h3>
            <span className="home-menu__arrow">→</span>
          </div>
          <div className="home-menu__card card-blue" onClick={() => onViewChange('activity-report')}>
            <div className="home-menu__icon-wrap icon-blue">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6"/></svg>
            </div>
            <h3 className="home-menu__card-title">Tổng hợp báo cáo Hoạt động cơ sở</h3>
            <span className="home-menu__arrow">→</span>
          </div>
        </div>
      </div>

      <div className="home-menu__section">
        <div className="home-menu__header">Báo cáo kết quả khảo sát sau chương trình</div>
        <div className="home-menu__cards">
          <div className="home-menu__card card-yellow" onClick={() => onViewChange('dashboard')}>
            <div className="home-menu__icon-wrap icon-yellow">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/></svg>
            </div>
            <h3 className="home-menu__card-title">Xem kết quả khảo sát sinh viên sau chương trình</h3>
            <span className="home-menu__arrow">→</span>
          </div>
        </div>
      </div>

      <div className="home-menu__section">
        <div className="home-menu__header">Tổng hợp Hòm thư lắng nghe</div>
        <div className="home-menu__cards">
          <div className="home-menu__card card-green" onClick={() => onViewChange('mailbox')}>
            <div className="home-menu__icon-wrap icon-green">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 8l2-5h12l2 5v11H4z"/><path d="M4 13h5l2 3h2l2-3h5"/></svg>
            </div>
            <h3 className="home-menu__card-title">Tổng hợp ý kiến sinh viên</h3>
            <span className="home-menu__arrow">→</span>
          </div>
          <div className="home-menu__card card-purple" onClick={() => onViewChange('responses')}>
            <div className="home-menu__icon-wrap icon-purple">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </div>
            <h3 className="home-menu__card-title">Dữ liệu trả lời</h3>
            <span className="home-menu__arrow">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App root ───────────────────────────────────────────
function App() {
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['menu', 'activity-report', 'dashboard', 'mailbox', 'responses'].includes(hash) ? hash : 'menu';
  });
  const [selectedPrograms, setSelectedPrograms] = useState(() => new Set());
  const [dataKey, setDataKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [mailbox, setMailbox] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (window.location.hash !== `#${view}`) {
      window.location.hash = view;
    }
  }, [view]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['menu', 'activity-report', 'dashboard', 'mailbox', 'responses'].includes(hash)) {
        setView(hash);
      } else {
        setView('menu');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadData = () => {
    setLoading(true);
    if (!APPS_SCRIPT_URL) {
      setUpdatedAt(new Date().toLocaleTimeString('vi-VN'));
      setDataKey(k => k + 1);
      setLoading(false);
      return;
    }
    fetch(APPS_SCRIPT_URL + '?action=getResponses')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          window.SURVEY_RESPONSES = data.responses || [];
          if (data.programs?.length > 0) {
            window.PROGRAMS = data.programs;
          }
          window.PARTICIPANT_MAP = data.participantMap || {};
          if (data.programYears) {
            window.PROGRAM_YEARS = { ...(window.PROGRAM_YEARS || {}), ...data.programYears };
          }
          if (data.programInfo) {
            window.PROGRAM_INFO = { ...(window.PROGRAM_INFO || {}), ...data.programInfo };
          }
          setUpdatedAt(new Date().toLocaleTimeString('vi-VN'));
          setDataKey(k => k + 1);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();

    if (!APPS_SCRIPT_URL) return;
    fetch(APPS_SCRIPT_URL + '?action=getMailbox')
      .then(r => r.json())
      .then(data => { if (data.success) setMailbox(data.entries || []); })
      .catch(() => { });
  }, []);

  const responses = useMemo(
    () => selectedPrograms.size === 0 ? [] : window.filterByPrograms(selectedPrograms),
    [selectedPrograms, dataKey]
  );

  const handleToggle = p => {
    setSelectedPrograms(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  // Thêm hoặc bỏ một nhóm chương trình cùng lúc (dùng khi toggle năm)
  const handleBatchSet = (programs, shouldSelect) => {
    setSelectedPrograms(prev => {
      const next = new Set(prev);
      if (shouldSelect) programs.forEach(p => next.add(p));
      else programs.forEach(p => next.delete(p));
      return next;
    });
  };

  return (
    <>
      <TopNav />
      {!loading && updatedAt && (
        <div className="admin-status-row">
          <span>✓ Cập nhật lúc {updatedAt}</span>
          <button onClick={() => window.location.reload()}>↻ Làm mới</button>
        </div>
      )}

      {view === 'menu' && (
        <HomeMenu onViewChange={setView} onAddActivityClick={() => setShowAddModal(true)} />
      )}

      {view === 'activity-report' && (
        <ActivityReport onBack={() => setView('menu')} />
      )}

      {view === 'dashboard' && (
        <div className="dashboard-layout">
          <ProgramSidebar
            selectedPrograms={selectedPrograms}
            onToggle={handleToggle}
            onBatchSet={handleBatchSet}
            onHomeClick={() => setView('menu')}
          />
          <main className="main dashboard-main">
            <ActivityCard selectedPrograms={selectedPrograms} responses={responses} />
            {selectedPrograms.size > 0 && (
              <>
                <DescriptiveSection responses={responses} selectedPrograms={selectedPrograms} />
                <ReportTabs responses={responses} />
              </>
            )}
          </main>
        </div>
      )}

      {view === 'mailbox' && (
        <div className="dashboard-layout" style={{ justifyContent: 'center' }}>
          <main className="main dashboard-main" style={{ maxWidth: 900, margin: '20px auto', width: '100%' }}>
            <div style={{ marginBottom: 20, fontSize: 14, color: '#006b5e', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setView('menu')}>
              <span style={{ fontSize: 18 }}>←</span> Quay lại
            </div>
            <MailboxSection entries={mailbox} />
          </main>
        </div>
      )}

      {view === 'responses' && (
        <div className="dashboard-layout" style={{ justifyContent: 'center' }}>
          <main className="main dashboard-main" style={{ maxWidth: 1180, margin: '20px auto', width: '100%' }}>
            <button className="admin-back-link" onClick={() => setView('menu')}>← Quay lại</button>
            <Section icon={Icon.Notes} title="Dữ liệu trả lời đã ẩn danh">
              <div className="privacy-note">Bảng này không hiển thị họ tên, email, mã sinh viên, số điện thoại hoặc liên kết mạng xã hội.</div>
              <div className="response-table-wrap">
                <table className="response-table">
                  <thead><tr><th>Mã</th><th>Thời gian</th><th>Hoạt động</th><th>Năm học</th><th>Nhóm ngành</th><th>Giới tính</th><th>Điểm</th></tr></thead>
                  <tbody>{window.SURVEY_RESPONSES.map((r, i) => <tr key={r.id || i}><td>{r.id || `P-${i + 1}`}</td><td>{r.ts}</td><td>{r.program}</td><td>{r.cohort || '—'}</td><td>{r.faculty || '—'}</td><td>{r.gender || '—'}</td><td>{r.overall || '—'}</td></tr>)}</tbody>
                </table>
              </div>
            </Section>
          </main>
        </div>
      )}

      <Footer />
      {showAddModal && (
        <AddActivityModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </>
  );
}

// ── AddActivityModal: Panel/Form thêm hoạt động mới ────────────────
function AddActivityModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    courseName: '',
    participants: '',
    loaiHoatDong: '',
    quyMo: '',
    donViToChuc: '',
    donViPhoiHop: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    tongKinhPhi: '',
    soLieuKhacTen: '',
    soLieuKhacSl: '',
    linkVanBan: '',
    linkMinhChung: '',
    tomTatHd: '',
    danhGiaHieuQua: '',
    batDauKhaoSat: '',
    ketThucKhaoSat: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.courseName.trim()) {
      setError('Tên hoạt động không được để trống.');
      return;
    }
    if (!form.participants || isNaN(form.participants) || parseInt(form.participants) < 0) {
      setError('Số lượng tham gia phải là số nguyên dương.');
      return;
    }
    if (!form.loaiHoatDong.trim()) {
      setError('Loại hoạt động không được để trống.');
      return;
    }
    if (!form.quyMo.trim()) {
      setError('Quy mô hoạt động không được để trống.');
      return;
    }
    if (form.tongKinhPhi && (isNaN(form.tongKinhPhi) || parseFloat(form.tongKinhPhi) < 0)) {
      setError('Tổng kinh phí phải là số không âm.');
      return;
    }
    if (form.soLieuKhacSl && (isNaN(form.soLieuKhacSl) || parseInt(form.soLieuKhacSl) < 0)) {
      setError('Số lượng số liệu khác phải là số không âm.');
      return;
    }
    if (!form.ngayBatDau || !form.ngayKetThuc || !form.batDauKhaoSat || !form.ketThucKhaoSat) {
      setError('Vui lòng điền đầy đủ tất cả các mốc thời gian.');
      return;
    }
    if (form.ngayKetThuc < form.ngayBatDau) {
      setError('Ngày kết thúc hoạt động không được trước ngày bắt đầu.');
      return;
    }
    if (form.ketThucKhaoSat < form.batDauKhaoSat) {
      setError('Hạn chót khảo sát không được trước ngày bắt đầu khảo sát.');
      return;
    }
    setError('');
    setSaving(true);

    if (!APPS_SCRIPT_URL) {
      const year = form.ngayBatDau ? new Date(form.ngayBatDau + 'T00:00:00').getFullYear() : new Date().getFullYear();
      if (!window.PROGRAMS.includes(form.courseName.trim())) {
        window.PROGRAMS = [...window.PROGRAMS, form.courseName.trim()];
      }
      window.PARTICIPANT_MAP[form.courseName.trim()] = parseInt(form.participants, 10);
      window.PROGRAM_YEARS[form.courseName.trim()] = year;
      window.PROGRAM_INFO[form.courseName.trim()] = {
        loaiHoatDong: form.loaiHoatDong,
        quyMo: form.quyMo,
        donViToChuc: form.donViToChuc,
        donViPhoiHop: form.donViPhoiHop,
        ngayBatDau: form.ngayBatDau,
        ngayKetThuc: form.ngayKetThuc,
        batDauKhaoSat: form.batDauKhaoSat,
        ketThucKhaoSat: form.ketThucKhaoSat,
      };
      window.setTimeout(onSaved, 350);
      return;
    }

    const params = new URLSearchParams({
      action: 'addActivity',
      ...form
    });

    fetch(APPS_SCRIPT_URL + '?' + params.toString())
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          onSaved();
        } else {
          setError(data.error || 'Lỗi không xác định.');
          setSaving(false);
        }
      })
      .catch(() => {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.');
        setSaving(false);
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <h2>Thêm Hoạt Động Mới</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ color: 'var(--c-bad)', background: 'var(--c-bad-soft)', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-field">
              <label>Tên hoạt động <span className="req">*</span></label>
              <input type="text" name="courseName" value={form.courseName} onChange={handleChange} required placeholder="Ví dụ: Chương trình phát triển kỹ năng" />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Loại hoạt động <span className="req">*</span></label>
                <input type="text" name="loaiHoatDong" value={form.loaiHoatDong} onChange={handleChange} required placeholder="Ví dụ: Hoạt động của đơn vị" />
              </div>
              <div className="form-field">
                <label>Quy mô hoạt động <span className="req">*</span></label>
                <input type="text" name="quyMo" value={form.quyMo} onChange={handleChange} required placeholder="Ví dụ: Cấp cơ sở trực thuộc" />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Đơn vị tổ chức</label>
                <input type="text" name="donViToChuc" value={form.donViToChuc} onChange={handleChange} placeholder="Ví dụ: Đoàn - Hội" />
              </div>
              <div className="form-field">
                <label>Đơn vị phối hợp</label>
                <input type="text" name="donViPhoiHop" value={form.donViPhoiHop} onChange={handleChange} placeholder="Ví dụ: Câu lạc bộ sinh viên" />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Số lượng tham gia <span className="req">*</span></label>
                <input type="number" name="participants" value={form.participants} onChange={handleChange} required min="1" placeholder="Ví dụ: 52" />
              </div>
              <div className="form-field">
                <label>Tổng kinh phí (VNĐ)</label>
                <input type="number" name="tongKinhPhi" value={form.tongKinhPhi} onChange={handleChange} min="0" placeholder="Ví dụ: 1150000" />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Số liệu khác - Tên số liệu</label>
                <input type="text" name="soLieuKhacTen" value={form.soLieuKhacTen} onChange={handleChange} placeholder="Ví dụ: Số phần việc thanh niên" />
              </div>
              <div className="form-field">
                <label>Số liệu khác - Số lượng (SL)</label>
                <input type="number" name="soLieuKhacSl" value={form.soLieuKhacSl} onChange={handleChange} min="0" placeholder="Ví dụ: 1" />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Link văn bản</label>
                <input type="text" name="linkVanBan" value={form.linkVanBan} onChange={handleChange} placeholder="Ví dụ: https://drive.google.com/file/d/..." />
              </div>
              <div className="form-field">
                <label>Link minh chứng</label>
                <input type="text" name="linkMinhChung" value={form.linkMinhChung} onChange={handleChange} placeholder="Ví dụ: https://www.facebook.com/share/p/..." />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Tóm tắt hoạt động</label>
                <textarea name="tomTatHd" value={form.tomTatHd} onChange={handleChange} placeholder="Tóm tắt ngắn gọn nội dung hoạt động..." />
              </div>
              <div className="form-field">
                <label>Đánh giá hiệu quả HĐ</label>
                <textarea name="danhGiaHieuQua" value={form.danhGiaHieuQua} onChange={handleChange} placeholder="Đánh giá kết quả, hiệu quả đạt được..." />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Ngày bắt đầu hoạt động <span className="req">*</span></label>
                <input type="date" name="ngayBatDau" value={form.ngayBatDau} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Ngày kết thúc hoạt động <span className="req">*</span></label>
                <input type="date" name="ngayKetThuc" value={form.ngayKetThuc} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Ngày bắt đầu khảo sát <span className="req">*</span></label>
                <input type="date" name="batDauKhaoSat" value={form.batDauKhaoSat} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Hạn chót khảo sát <span className="req">*</span></label>
                <input type="date" name="ketThucKhaoSat" value={form.ketThucKhaoSat} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu hoạt động'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
