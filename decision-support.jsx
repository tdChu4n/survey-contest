/* decision-support.jsx — Joint Display + action knowledge base for NEXUS */

const NEXUS_ACTION_KNOWLEDGE = [
  {
    code: 'DVTT1', importance: 0.92,
    issue: 'Thông tin trước chương trình chưa kịp thời',
    keywords: ['thong bao', 'thong tin', 'dia diem', 'lich', 'tre'],
    diagnosis: 'Thông tin quan trọng đang được gửi muộn hoặc chưa đồng nhất giữa các kênh.',
    actions: [
      'Chốt và gửi thông báo chính thức tối thiểu 5 ngày trước chương trình.',
      'Dùng mẫu thông báo bắt buộc có thời gian, địa điểm, đối tượng và người liên hệ.',
      'Gửi một bản nhắc lại trước 24 giờ và cập nhật đồng thời trên mọi kênh.'
    ],
    metric: 'Tỷ lệ thông báo đúng hạn và điểm DVTT1 ở chương trình tiếp theo',
    target: 'DVTT1 ≥ 5,0/7; ít nhất 90% thông báo đúng hạn'
  },
  {
    code: 'CSVC2', importance: 0.86,
    issue: 'Âm thanh và thiết bị chưa ổn định',
    keywords: ['am thanh', 'micro', 'thiet bi', 'loa', 'anh sang'],
    diagnosis: 'Khâu kiểm tra kỹ thuật trước chương trình chưa đủ để phát hiện lỗi tại vị trí người tham dự.',
    actions: [
      'Thực hiện checklist âm thanh, ánh sáng và trình chiếu trước ít nhất 30 phút.',
      'Thử micro tại đầu, giữa và cuối phòng thay vì chỉ kiểm tra trên sân khấu.',
      'Chuẩn bị micro, pin và cáp kết nối dự phòng; chỉ định một người trực kỹ thuật.'
    ],
    metric: 'Số sự cố kỹ thuật và điểm CSVC2 ở chương trình tiếp theo',
    target: 'CSVC2 ≥ 5,0/7; không quá 1 sự cố kỹ thuật'
  },
  {
    code: 'CLCT5', importance: 0.79,
    issue: 'Tiến độ chương trình chưa đúng kế hoạch',
    keywords: ['thoi gian', 'keo dai', 'cham', 'lich trinh', 'linh hoat'],
    diagnosis: 'Thời lượng từng phần và khoảng dự phòng chưa được kiểm soát rõ trong kịch bản vận hành.',
    actions: [
      'Gắn thời lượng và người chịu trách nhiệm cho từng phần trong rundown.',
      'Bố trí 10–15 phút dự phòng và quy định tín hiệu nhắc thời gian cho điều phối viên.',
      'Ghi nhận thời gian thực tế sau chương trình để điều chỉnh rundown lần sau.'
    ],
    metric: 'Độ lệch thời gian kết thúc và điểm CLCT5',
    target: 'Kết thúc lệch không quá 10 phút; CLCT5 ≥ 5,2/7'
  },
  {
    code: 'CLCT1', importance: 0.72,
    issue: 'Hỗ trợ người tham dự chưa nhất quán',
    keywords: ['ho tro', 'giai dap', 'check-in', 'xep hang', 'cho lau'],
    diagnosis: 'Điểm tiếp nhận và nhân sự hỗ trợ chưa có hướng dẫn xử lý thống nhất khi lượng người tăng.',
    actions: [
      'Tách luồng check-in và hỗ trợ thắc mắc thành hai vị trí.',
      'Chuẩn bị bộ câu trả lời nhanh cho các câu hỏi thường gặp.',
      'Bổ sung nhân sự hỗ trợ trong 20 phút cao điểm đầu chương trình.'
    ],
    metric: 'Thời gian chờ trung bình và điểm CLCT1',
    target: 'Thời gian chờ dưới 5 phút; CLCT1 ≥ 5,2/7'
  }
];

const OPEN_FIELD_LABELS = {
  learn: 'Giá trị nhận được',
  trouble: 'Khó khăn gặp phải',
  interest: 'Nhu cầu sinh viên',
  feedback: 'Góp ý cải thiện'
};

function nexusNormalize(value) {
  return String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function nexusItemMeta(code) {
  for (const factor of window.FACTORS || []) {
    const item = factor.items.find(entry => entry.code === code);
    if (item) return { factor: factor.name, label: item.label };
  }
  return { factor: 'Khác', label: code };
}

function nexusClassification(importance, performance) {
  if (importance >= 0.75 && performance < 4.5) return { label: 'Ưu tiên cải thiện', tone: 'urgent' };
  if (importance >= 0.75 && performance >= 5) return { label: 'Duy trì', tone: 'maintain' };
  if (importance < 0.75 && performance < 4.5) return { label: 'Cần xem sâu', tone: 'inspect' };
  return { label: 'Theo dõi', tone: 'watch' };
}

function buildNexusInsights(responses) {
  if (!responses.length) return [];
  return NEXUS_ACTION_KNOWLEDGE.map(rule => {
    const meta = nexusItemMeta(rule.code);
    const values = responses.map(r => Number(r[rule.code])).filter(Number.isFinite);
    const performance = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const positive = values.length ? Math.round(values.filter(value => value >= 5).length / values.length * 100) : 0;
    const distribution = [1,2,3,4,5,6,7].map(score => values.filter(value => value === score).length);
    const evidence = [];

    responses.forEach(response => {
      Object.keys(OPEN_FIELD_LABELS).forEach(field => {
        const text = String(response[field] || '').trim();
        const normalized = nexusNormalize(text);
        if (!text || normalized === 'khong co.' || normalized === 'khong co') return;
        if (rule.keywords.some(keyword => normalized.includes(keyword))) {
          evidence.push({ source: OPEN_FIELD_LABELS[field], text, responseId: response.id });
        }
      });
    });

    const classification = nexusClassification(rule.importance, performance);
    const priorityScore = Math.round(Math.min(100,
      rule.importance * Math.max(0, 7 - performance) / 6 * 100 + Math.min(12, evidence.length) * 1.2
    ));

    return { ...rule, ...meta, performance, positive, distribution, evidence, classification, priorityScore };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

function MiniLikertDistribution({ values }) {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const colors = ['#c2413a','#df6548','#e99b3a','#a8b1bd','#64a8c8','#2e9a78','#08756f'];
  return (
    <div>
      <div className="nexus-likert-bar">
        {values.map((value, index) => value > 0 && (
          <span key={index} style={{ width: `${value / total * 100}%`, background: colors[index] }} title={`Điểm ${index + 1}: ${value} phiếu`} />
        ))}
      </div>
      <div className="nexus-likert-labels"><span>1 — Không đồng ý</span><span>7 — Đồng ý</span></div>
    </div>
  );
}

function DecisionSupport({ onBack }) {
  const programs = window.PROGRAMS || [];
  const [program, setProgram] = React.useState('__ALL__');
  const [selectedCode, setSelectedCode] = React.useState('');
  const [checkedActions, setCheckedActions] = React.useState({});
  const [saved, setSaved] = React.useState(false);

  const responses = React.useMemo(() => (
    program === '__ALL__' ? (window.SURVEY_RESPONSES || []) : window.filterByProgram(program)
  ), [program]);
  const insights = React.useMemo(() => buildNexusInsights(responses), [responses]);
  const selected = insights.find(item => item.code === selectedCode) || insights[0];

  React.useEffect(() => {
    if (selected && selected.code !== selectedCode) setSelectedCode(selected.code);
    setCheckedActions({});
    setSaved(false);
  }, [program]);

  if (!selected) return <div className="admin-subpage">Chưa có dữ liệu để phân tích.</div>;

  const toggleAction = index => {
    setCheckedActions(current => ({ ...current, [index]: !current[index] }));
    setSaved(false);
  };
  const chosenCount = Object.values(checkedActions).filter(Boolean).length;
  const savePlan = () => {
    const storageKey = 'nexusImprovementPlans';
    const selectedActions = selected.actions.filter((_, index) => checkedActions[index]);
    let plans = [];
    try { plans = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { plans = []; }
    const planId = `${program}:${selected.code}`;
    const plan = {
      id: planId,
      program: program === '__ALL__' ? 'Tất cả hoạt động' : program,
      itemCode: selected.code,
      issue: selected.issue,
      actions: selectedActions,
      metric: selected.metric,
      target: selected.target,
      status: 'Chờ triển khai',
      savedAt: new Date().toLocaleString('vi-VN')
    };
    localStorage.setItem(storageKey, JSON.stringify([...plans.filter(entry => entry.id !== planId), plan]));
    setSaved(true);
  };

  return (
    <div className="admin-subpage nexus-page">
      <button className="admin-back-link" onClick={onBack}>← Quay lại</button>
      <div className="admin-subpage__heading nexus-heading">
        <div>
          <h1>NEXUS — Từ phản hồi đến hành động</h1>
          <p>Likert chỉ ra điểm yếu · Phản hồi mở giải thích nguyên nhân · Kho giải pháp đề xuất cách cải thiện</p>
        </div>
        <label className="nexus-program-filter">Hoạt động
          <select value={program} onChange={event => setProgram(event.target.value)}>
            <option value="__ALL__">Tất cả hoạt động</option>
            {programs.map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
      </div>

      <div className="nexus-flow" aria-label="Luồng hỗ trợ ra quyết định">
        <span>Điểm Likert</span><b>→</b><span>Phản hồi mở</span><b>→</b><span>Chẩn đoán</span><b>→</b><span>Hành động</span><b>→</b><span>Đo lại</span>
      </div>

      <div className="nexus-layout">
        <aside className="nexus-priority-list">
          <div className="nexus-panel-title">Cần sửa gì trước?</div>
          {insights.map((item, index) => (
            <button key={item.code} className={`nexus-priority-item${selected.code === item.code ? ' is-active' : ''}`} onClick={() => { setSelectedCode(item.code); setCheckedActions({}); setSaved(false); }}>
              <span className="nexus-priority-rank">#{index + 1}</span>
              <span className="nexus-priority-copy"><strong>{item.issue}</strong><small>{item.code} · {item.performance.toFixed(2)}/7 · {item.evidence.length} bằng chứng mở</small></span>
              <span className={`nexus-status nexus-status--${item.classification.tone}`}>{item.classification.label}</span>
            </button>
          ))}
        </aside>

        <main className="nexus-workspace">
          <div className="nexus-summary-row">
            <div><span>Ưu tiên</span><strong>{selected.priorityScore}/100</strong></div>
            <div><span>Điểm Likert</span><strong>{selected.performance.toFixed(2)}/7</strong></div>
            <div><span>Tỷ lệ tích cực</span><strong>{selected.positive}%</strong></div>
            <div><span>Phản hồi liên quan</span><strong>{selected.evidence.length}</strong></div>
          </div>

          <section className="nexus-joint-card">
            <div className="nexus-panel-title">Joint Display — Vì sao đây là vấn đề?</div>
            <div className="nexus-joint-grid">
              <div className="nexus-evidence-block">
                <span className="nexus-eyebrow">BẰNG CHỨNG ĐỊNH LƯỢNG</span>
                <h3>{selected.code} — {selected.label}</h3>
                <div className="nexus-big-score">{selected.performance.toFixed(2)}<small>/7</small></div>
                <MiniLikertDistribution values={selected.distribution} />
                <p>Importance giả lập: <strong>{Math.round(selected.importance * 100)}%</strong>. Hiệu suất thấp làm yếu tố này được xếp vào nhóm <strong>{selected.classification.label.toLowerCase()}</strong>.</p>
              </div>
              <div className="nexus-evidence-block nexus-open-evidence">
                <span className="nexus-eyebrow">BẰNG CHỨNG TỪ 4 CÂU HỎI MỞ</span>
                <h3>Phản hồi giải thích nguyên nhân</h3>
                {selected.evidence.length ? selected.evidence.slice(0, 4).map((entry, index) => (
                  <blockquote key={`${entry.responseId}-${index}`}><span>{entry.source}</span>“{entry.text}”</blockquote>
                )) : <p className="nexus-empty">Chưa có phản hồi mở khớp chủ đề; cần xem sâu hoặc thu thập thêm bằng chứng.</p>}
              </div>
            </div>
            <div className="nexus-diagnosis"><span>CHẨN ĐOÁN TỔNG HỢP</span><strong>{selected.diagnosis}</strong></div>
          </section>

          <section className="nexus-action-card">
            <div className="nexus-action-head">
              <div><span className="nexus-eyebrow">KHO GIẢI PHÁP QUẢN TRỊ</span><h2>Sửa như thế nào?</h2></div>
              <span className="nexus-knowledge-badge">Giải pháp chuẩn · Có thể kiểm chứng</span>
            </div>
            <div className="nexus-actions">
              {selected.actions.map((action, index) => (
                <label key={index} className={checkedActions[index] ? 'is-checked' : ''}>
                  <input type="checkbox" checked={!!checkedActions[index]} onChange={() => toggleAction(index)} />
                  <span><b>{index + 1}</b>{action}</span>
                </label>
              ))}
            </div>
            <div className="nexus-measure">
              <div><span>Chỉ số theo dõi</span><strong>{selected.metric}</strong></div>
              <div><span>Mục tiêu lần tới</span><strong>{selected.target}</strong></div>
            </div>
            <div className="nexus-plan-footer">
              <p>{chosenCount ? `Đã chọn ${chosenCount}/${selected.actions.length} hành động cho kế hoạch.` : 'Chọn các hành động phù hợp trước khi lưu kế hoạch cải thiện.'}</p>
              <button disabled={!chosenCount} onClick={savePlan}>{saved ? '✓ Đã lưu vào kế hoạch' : 'Lưu kế hoạch cải thiện'}</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
