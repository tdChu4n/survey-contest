/* decision-support.jsx — NEXUS analysis built from live Likert and open-response data. */

const NEXUS_OPEN_FIELDS = {
  learn: 'Giá trị nhận được', trouble: 'Khó khăn gặp phải',
  interest: 'Nhu cầu sắp tới', feedback: 'Góp ý cải thiện'
};

const NEXUS_FACTOR_KNOWLEDGE = {
  DVTT: {
    diagnosis: 'Quy trình truyền thông và cung cấp thông tin chưa tạo được trải nghiệm nhất quán trước khi người học tham gia.',
    actions: [
      'Chuẩn hóa mẫu thông báo bắt buộc có thời gian, địa điểm, đối tượng, cách đăng ký và đầu mối hỗ trợ.',
      'Chốt lịch truyền thông theo các mốc T-7, T-3 và T-1; cập nhật thay đổi đồng thời trên các kênh.',
      'Kiểm tra nhanh thông điệp với một nhóm sinh viên trước khi phát hành và ghi nhận tỷ lệ tiếp cận.'
    ]
  },
  CLCT: {
    diagnosis: 'Nội dung, cách tổ chức hoặc điều phối chương trình chưa đáp ứng đồng đều kỳ vọng của người tham dự.',
    actions: [
      'Chuyển mục tiêu chương trình thành checklist nội dung, người phụ trách và tiêu chí nghiệm thu rõ ràng.',
      'Chạy thử kịch bản, phân vai hỗ trợ và bố trí 10–15 phút dự phòng trước khi chương trình diễn ra.',
      'Họp rút kinh nghiệm trong 48 giờ, chọn một nguyên nhân gốc và giao người chịu trách nhiệm xử lý.'
    ]
  },
  CSVC: {
    diagnosis: 'Điều kiện không gian hoặc thiết bị chưa được kiểm tra đầy đủ theo trải nghiệm thực tế của người tham dự.',
    actions: [
      'Khảo sát địa điểm theo quy mô đăng ký và kiểm tra trải nghiệm tại đầu, giữa và cuối khu vực tổ chức.',
      'Dùng checklist âm thanh, ánh sáng, trình chiếu, chỗ ngồi và lối di chuyển trước ít nhất 30 phút.',
      'Chuẩn bị phương án dự phòng cho thiết bị quan trọng và chỉ định một đầu mối xử lý sự cố tại chỗ.'
    ]
  },
  GTCT: {
    diagnosis: 'Giá trị người tham dự nhận được chưa tương xứng hoàn toàn với thời gian và kỳ vọng ban đầu.',
    actions: [
      'Công bố rõ kết quả người tham dự sẽ nhận được và loại bỏ phần không phục vụ trực tiếp mục tiêu đó.',
      'Tăng phần thực hành, tình huống thật hoặc sản phẩm đầu ra có thể áp dụng sau chương trình.',
      'Đo kỳ vọng trước và giá trị nhận được sau chương trình để xác định khoảng cách cần xử lý.'
    ]
  },
  SHL: {
    diagnosis: 'Trải nghiệm tổng thể còn điểm nghẽn, làm giảm cảm xúc tích cực và mức độ hài lòng của người tham dự.',
    actions: [
      'Tổng hợp ba điểm chạm có ảnh hưởng lớn nhất và ưu tiên xử lý điểm chạm có nhiều bằng chứng nhất.',
      'Giao một chủ sở hữu, thời hạn và chỉ số kết quả cho từng hành động cải thiện được chọn.',
      'Thực hiện pulse survey ngắn sau lần tổ chức tiếp theo để kiểm tra mức thay đổi.'
    ]
  },
  LTT: {
    diagnosis: 'Ý định quay lại, giới thiệu hoặc tiếp tục đóng góp phản hồi chưa được củng cố sau chương trình.',
    actions: [
      'Gửi nội dung follow-up, tài liệu và kết quả chương trình trong vòng 48 giờ.',
      'Tạo lộ trình hoạt động tiếp theo phù hợp nhu cầu đã ghi nhận và mời đúng nhóm sinh viên quan tâm.',
      'Thông báo những thay đổi được thực hiện từ góp ý để người tham dự thấy phản hồi của họ có giá trị.'
    ]
  }
};

const NEXUS_ITEM_TOPICS = {
  DVTT1: { topic: 'Thông tin kịp thời', keywords: ['thong bao tre','thong tin tre','gui tre','gui mail tre','mail tre','mail cham','gui mail som','cap nhat tre','kip thoi','qua muon','sat gio','sat ngay','doi lich','thay doi lich'] },
  DVTT2: { topic: 'Địa điểm và chỉ dẫn', keywords: ['dia diem','phong hoc','phong to chuc','khu vuc dien ra','ban do','chi duong','duong den','duong di','kho tim','tim dia diem','vi tri to chuc'] },
  DVTT3: { topic: 'Thông tin đăng ký', keywords: ['email','mail','truyen thong','dang ky','huong dan','ro rang','chua ro','noi dung cu the','khong biet','khong nhan duoc mail','the le'] },
  DVTT4: { topic: 'Ấn phẩm truyền thông', keywords: ['poster','an pham','hinh anh','thiet ke','thu hut'] },
  CLCT1: { topic: 'Hỗ trợ và giải đáp', keywords: ['ho tro','giai dap','nhan su','check-in','check in','checkin','xep hang','cho lau'] },
  CLCT2: { topic: 'Hình thức hoạt động', keywords: ['da dang','hinh thuc','workshop','tro choi','tuong tac'] },
  CLCT3: { topic: 'Chiều sâu nội dung', keywords: ['noi dung','kien thuc','tim hieu','chuyen sau','hoc hoi'] },
  CLCT4: { topic: 'Mức độ phù hợp', keywords: ['muc tieu','chu de','phu hop','lan man','dung nhu'] },
  CLCT5: { topic: 'Bố cục và thời gian', keywords: ['thoi gian','keo dai','cham','cham tre','bat dau muon','qua gio','delay','lich trinh','timeline','chay timeline','bo cuc','rundown'] },
  CSVC1: { topic: 'Không gian tổ chức', keywords: ['khong gian','quy mo','phong hoc','phong to chuc','chat choi','dia diem to chuc'] },
  CSVC2: { topic: 'Thiết bị kỹ thuật', keywords: ['am thanh','anh sang','micro','loa','may chieu','thiet bi','ky thuat','ki thuat','loi ky thuat','loi ki thuat','zoom','meet','link zoom','duong link','phong zoom','qua tai','gioi han nguoi','capacity','may moc','ung dung hop'] },
  CSVC3: { topic: 'Sự thoải mái', keywords: ['cho ngoi','ghe','nong','lanh','dieu hoa','thoai mai'] },
  GTCT1: { topic: 'Giá trị thực tế', keywords: ['gia tri','huu ich','thiet thuc','ap dung','xung dang','hoc duoc','hieu duoc','nhan duoc'] },
  GTCT2: { topic: 'Kỳ vọng', keywords: ['ky vong','mong doi','vuot','that vong'] },
  SHL1: { topic: 'Hài lòng tổng thể', keywords: ['hai long','trai nghiem','tong the'] },
  SHL2: { topic: 'Cảm xúc tham gia', keywords: ['cam xuc','vui','thich','tich cuc','chan'] },
  SHL3: { topic: 'Lựa chọn tham gia', keywords: ['lua chon','quyet dinh','xung dang','tiec'] },
  LTT1: { topic: 'Chia sẻ tích cực', keywords: ['chia se','tich cuc','noi tot','truyen mieng'] },
  LTT2: { topic: 'Ý định quay lại', keywords: ['tiep tuc','lan sau','dang ky','quay lai'] },
  LTT3: { topic: 'Ý định giới thiệu', keywords: ['gioi thieu','ban be','nguoi quen'] },
  LTT4: { topic: 'Đóng góp phản hồi', keywords: ['phan hoi','gop y','cai thien','lang nghe'] }
};

const NEXUS_NEGATIVE_WORDS = ['khong tot','chua tot','khong hai long','khong ro rang','chua ro','khong kip thoi','chua kip','khong phu hop','khong hieu','khong biet','khong the','khong du','khong duoc','khong nhan duoc','khong vao duoc','khong luu','kem','te hai','gui tre','bi tre','thong bao tre','qua lau','cho lau','kho khan','gap van de','bat tien','bat cap','phien toai','lang phi','that vong','bi loi','loi ky thuat','loi ki thuat','truc trac','su co','qua tai','gioi han','chay timeline','delay','cham tre','so suat','chua thuan loi','khong thoai mai','kho chiu','on ao','qua nong','chat choi','thieu','hoi nhieu','qua day','keo dai','lan man','qua dai','met moi','nham chan'];
const NEXUS_POSITIVE_WORDS = ['tot','huu ich','bo ich','y nghia','hai long','thich','vui','rat vui','vui lam','tich cuc','ro rang','kip thoi','thoai mai','an tuong','xung dang','tuyet voi','hap dan','chu dao','nhiet tinh','thuan loi','de tiep thu','hoc duoc','hieu duoc','nhan duoc','ok','oke'];
const NEXUS_NO_RESPONSE_WORDS = new Set([
  'khong','khong co','em khong a','khong a','da khong a','da khong','da k a','da k','ko a','ko','da ko','hong','da hong','hem','da hem ne','kh co a','khong xin cam on','da tam thoi khong','minh khong','kho gn co','khogn co','khonh','khonh co','n a','na','kh','da k','da ko a','da hong ne','khong ah','da ko a','a','jkk','sjwj','yes','co','co m'
]);

// Các ngoại lệ đã được rà soát trực tiếp trên bộ dữ liệu cố định của bài thi.
const NEXUS_REVIEWED_SENTIMENT = new Map([
  ['trouble|da khong em thay vui lam', 'Tích cực'],
  ['trouble|dinh', 'Tích cực']
]);

function nexusNormalize(value) {
  return String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function nexusCleanWords(value) {
  return nexusNormalize(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function nexusHasPhrase(text, phrase) {
  const haystack = ` ${nexusCleanWords(text)} `;
  const needle = ` ${nexusCleanWords(phrase)} `;
  return needle.trim() && haystack.includes(needle);
}

function nexusIsNoResponse(text) {
  const cleaned = nexusCleanWords(text);
  if (!cleaned || NEXUS_NO_RESPONSE_WORDS.has(cleaned)) return true;
  return /^(da |em |minh )?(khong|ko|k|kh|hong|hem|khogn|khonh)( co)?( a| ah| ne| nha| nhe)?$/.test(cleaned);
}

function nexusNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 7 ? number : null;
}

function nexusMean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function nexusMedian(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function nexusCorrelation(pairs) {
  if (pairs.length < 5) return 0;
  const meanX = nexusMean(pairs.map(pair => pair.x));
  const meanY = nexusMean(pairs.map(pair => pair.y));
  let numerator = 0, denominatorX = 0, denominatorY = 0;
  pairs.forEach(pair => {
    const dx = pair.x - meanX, dy = pair.y - meanY;
    numerator += dx * dy; denominatorX += dx * dx; denominatorY += dy * dy;
  });
  const denominator = Math.sqrt(denominatorX * denominatorY);
  return denominator ? numerator / denominator : 0;
}

function nexusOutcome(response, itemCode) {
  const overall = nexusNumber(response.overall);
  if (overall !== null) return overall;
  const satisfaction = ['SHL1','SHL2','SHL3']
    .filter(code => code !== itemCode).map(code => nexusNumber(response[code]))
    .filter(value => value !== null);
  return satisfaction.length ? nexusMean(satisfaction) : null;
}

function nexusSentiment(text, field) {
  const normalized = nexusNormalize(text);
  const cleaned = nexusCleanWords(normalized);
  if (nexusIsNoResponse(cleaned)) return 'Trung lập';
  if (field === 'interest') return 'Trung lập';
  const reviewedKey = `${field}|${cleaned}`;
  if (NEXUS_REVIEWED_SENTIMENT.has(reviewedKey)) return NEXUS_REVIEWED_SENTIMENT.get(reviewedKey);
  const noProblem = /^(da )?khong$|^(da )?khong a$|(?:khong|chua) (?:gap|co|thay) (?:kho khan|van de|bat tien|gi)|khong co gi/.test(cleaned)
    || /^(da )?khong\s*[,;]/.test(normalized.trim());
  const hasContrast = ['tuy nhien','nhung','chi la','duy chi','mac du'].some(word => nexusHasPhrase(normalized, word));
  const negative = NEXUS_NEGATIVE_WORDS.filter(word => nexusHasPhrase(normalized, word)).length;
  const positive = NEXUS_POSITIVE_WORDS.filter(word => nexusHasPhrase(normalized, word) && !nexusHasPhrase(normalized, `khong ${word}`) && !nexusHasPhrase(normalized, `chua ${word}`)).length;
  if (noProblem && !hasContrast) return positive > 0 ? 'Tích cực' : 'Trung lập';
  if (field === 'learn') {
    const explicitFailure = ['khong nhan duoc','khong hoc duoc','khong hieu duoc','khong co gia tri']
      .some(word => nexusHasPhrase(normalized, word));
    if (explicitFailure) return 'Tiêu cực';
    return 'Tích cực';
  }
  if (field === 'trouble') {
    const startsPositive = /^(nhin chung|moi thu|trai nghiem|chuong trinh dien ra)/.test(cleaned) && positive > 0;
    if (negative > 0 && positive > 0) return startsPositive ? 'Trung lập' : 'Tiêu cực';
    if (negative > 0) return 'Tiêu cực';
    if (positive > 0) return 'Tích cực';
    return 'Tiêu cực';
  }
  if (field === 'feedback') {
    const isSuggestion = ['nen','mong','hy vong','can','co the','tot hon','cai thien','khac phuc','chu y','luu y']
      .some(word => nexusHasPhrase(normalized, word));
    if (isSuggestion) return 'Trung lập';
    if (negative > 0 && positive === 0) return 'Tiêu cực';
    if (positive > 0 && negative === 0) return 'Tích cực';
  }
  return 'Trung lập';
}

function nexusItemMeta() {
  const items = [];
  (window.FACTORS || []).forEach(factor => factor.items.forEach(item => items.push({
    code: item.code, label: item.label, factorCode: factor.code, factor: factor.name,
    ...(NEXUS_ITEM_TOPICS[item.code] || { topic: factor.name, keywords: [] })
  })));
  return items;
}

function nexusBestItemForComment(text, field, items) {
  const factorBias = {
    learn: { GTCT: 3, SHL: 2 },
    trouble: { DVTT: 2, CLCT: 2, CSVC: 2 },
    interest: { LTT: 2, CLCT: 1, GTCT: 1 },
    feedback: { DVTT: 1, CLCT: 1, CSVC: 1, GTCT: 1, SHL: 1, LTT: 1 }
  };
  let best = null;
  let bestScore = 0;
  items.forEach(candidate => {
    const matched = candidate.keywords.filter(keyword => nexusHasPhrase(text, keyword));
    if (!matched.length) return;
    const specificity = matched.reduce((sum, keyword) => sum + nexusCleanWords(keyword).split(' ').length, 0);
    const score = matched.length * 10 + specificity + (factorBias[field]?.[candidate.factorCode] || 0);
    if (score > bestScore) { best = candidate; bestScore = score; }
  });
  if (!best && field === 'learn') return items.find(candidate => candidate.code === 'GTCT1') || null;
  return best;
}

function nexusOpenEvidence(responses, item, items) {
  const evidence = [];
  responses.forEach((response, responseIndex) => Object.keys(NEXUS_OPEN_FIELDS).forEach(field => {
    const text = String(response[field] || '').trim();
    const normalized = nexusNormalize(text);
    if (!text || nexusIsNoResponse(text) || ['khong gap'].includes(normalized)) return;
    const bestItem = nexusBestItemForComment(text, field, items);
    if (bestItem?.code === item.code) {
      evidence.push({
        source: NEXUS_OPEN_FIELDS[field], text, sentiment: nexusSentiment(text, field),
        responseId: response.id || `R${responseIndex + 1}`, rating: nexusNumber(response[item.code])
      });
    }
  }));
  return evidence;
}

function nexusRelationship(performance, performanceMedian, evidence, lowRespondents) {
  const negative = evidence.filter(entry => entry.sentiment === 'Tiêu cực');
  const convergent = new Set(negative.filter(entry => entry.rating !== null && entry.rating <= 4).map(entry => entry.responseId));
  const divergent = new Set(negative.filter(entry => entry.rating !== null && entry.rating >= 5).map(entry => entry.responseId));
  const evidenceRespondents = new Set(evidence.map(entry => entry.responseId));
  if (convergent.size >= 2 && convergent.size >= divergent.size) return { label: 'Hội tụ', tone: 'urgent', detail: `${convergent.size} người vừa chấm thấp vừa nêu phản hồi tiêu cực cùng chủ đề.` };
  if (divergent.size >= 2 && divergent.size > convergent.size) return { label: 'Phân kỳ', tone: 'inspect', detail: `${divergent.size} người chấm từ 5 điểm nhưng vẫn nêu vấn đề; cần xem trải nghiệm theo từng điểm chạm.` };
  if (performance < performanceMedian && evidenceRespondents.size < 2) return { label: 'Thiếu bằng chứng', tone: 'watch', detail: `${lowRespondents} lượt chấm thấp nhưng chưa có đủ phản hồi mở khớp trực tiếp.` };
  return { label: 'Bổ sung', tone: 'maintain', detail: 'Phản hồi mở bổ sung ngữ cảnh cho kết quả Likert nhưng chưa tạo mâu thuẫn hoặc hội tụ mạnh.' };
}

function nexusClassification(importance, performance, importanceMedian, performanceMedian) {
  const highImportance = importance >= importanceMedian;
  const highPerformance = performance >= performanceMedian;
  if (highImportance && !highPerformance) return { label: 'Ưu tiên cải thiện', tone: 'urgent' };
  if (highImportance && highPerformance) return { label: 'Duy trì', tone: 'maintain' };
  if (!highImportance && !highPerformance) return { label: 'Cần xem sâu', tone: 'inspect' };
  return { label: 'Theo dõi', tone: 'watch' };
}

function buildNexusInsights(responses) {
  if (!responses.length) return [];
  const allItems = nexusItemMeta();
  const preliminaries = allItems.map(item => {
    const scored = responses.map(response => ({ response, value: nexusNumber(response[item.code]) })).filter(entry => entry.value !== null);
    if (!scored.length) return null;
    const values = scored.map(entry => entry.value);
    const pairs = scored.map(entry => ({ x: entry.value, y: nexusOutcome(entry.response, item.code) })).filter(pair => pair.y !== null);
    const evidence = nexusOpenEvidence(responses, item, allItems);
    const negativeEvidence = evidence.filter(entry => entry.sentiment === 'Tiêu cực');
    const performance = nexusMean(values);
    return {
      ...item, n: values.length, performance,
      positive: Math.round(values.filter(value => value >= 5).length / values.length * 100),
      lowRate: Math.round(values.filter(value => value <= 4).length / values.length * 100),
      lowRespondents: values.filter(value => value <= 4).length,
      distribution: [1,2,3,4,5,6,7].map(score => values.filter(value => value === score).length),
      rawImportance: Math.max(0, nexusCorrelation(pairs)), evidence, negativeEvidence,
      negativePercent: evidence.length ? Math.round(negativeEvidence.length / evidence.length * 100) : 0
    };
  }).filter(Boolean);
  if (!preliminaries.length) return [];
  const maxImportance = Math.max(...preliminaries.map(item => item.rawImportance), 0.01);
  preliminaries.forEach(item => { item.importance = item.rawImportance / maxImportance; });
  const importanceMedian = nexusMedian(preliminaries.map(item => item.importance));
  const performanceMedian = nexusMedian(preliminaries.map(item => item.performance));
  return preliminaries.map(item => {
    const classification = nexusClassification(item.importance, item.performance, importanceMedian, performanceMedian);
    const relationship = nexusRelationship(item.performance, performanceMedian, item.evidence, item.lowRespondents);
    const performanceGap = Math.max(0, 7 - item.performance) / 6;
    const evidenceWeight = Math.min(1, item.negativeEvidence.length / Math.max(3, item.n * 0.15));
    const priorityScore = Math.round(Math.min(100, (item.importance * 0.55 + performanceGap * 0.35 + evidenceWeight * 0.1) * 100));
    const knowledge = NEXUS_FACTOR_KNOWLEDGE[item.factorCode];
    return {
      ...item, classification, relationship, priorityScore,
      issue: `${item.topic}: ${item.label}`,
      diagnosis: `${knowledge.diagnosis} ${relationship.detail}`,
      actions: knowledge.actions,
      metric: `Điểm ${item.code}, tỷ lệ chấm 1–4 và số phản hồi tiêu cực cùng chủ đề`,
      target: `${item.code} ≥ ${Math.min(6.5, Math.max(5, item.performance + 0.4)).toFixed(1)}/7 và tỷ lệ chấm 1–4 giảm ít nhất 20%`
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

function MiniLikertDistribution({ values }) {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const colors = ['#c2413a','#df6548','#e99b3a','#a8b1bd','#64a8c8','#2e9a78','#08756f'];
  return <div><div className="nexus-likert-bar">{values.map((value, index) => value > 0 && <span key={index} style={{ width: `${value / total * 100}%`, background: colors[index] }} title={`Điểm ${index + 1}: ${value} phiếu`} />)}</div><div className="nexus-likert-labels"><span>1 — Hoàn toàn không đồng ý</span><span>7 — Hoàn toàn đồng ý</span></div></div>;
}

function DecisionSupport({ onBack, dataVersion = 0 }) {
  const programs = window.PROGRAMS || [], factors = window.FACTORS || [];
  const [program, setProgram] = React.useState('__ALL__');
  const [factorCode, setFactorCode] = React.useState('__ALL__');
  const [selectedCode, setSelectedCode] = React.useState('');
  const [checkedActions, setCheckedActions] = React.useState({});
  const [saved, setSaved] = React.useState(false);
  const responses = React.useMemo(() => program === '__ALL__' ? (window.SURVEY_RESPONSES || []) : window.filterByProgram(program), [program, dataVersion]);
  const insights = React.useMemo(() => buildNexusInsights(responses), [responses]);
  const visibleInsights = React.useMemo(() => factorCode === '__ALL__' ? insights : insights.filter(item => item.factorCode === factorCode), [insights, factorCode]);
  const selected = visibleInsights.find(item => item.code === selectedCode) || visibleInsights[0];

  React.useEffect(() => {
    if (selected && selected.code !== selectedCode) setSelectedCode(selected.code);
    setCheckedActions({}); setSaved(false);
  }, [program, factorCode, dataVersion]);

  if (!selected) return <div className="admin-subpage"><button className="admin-back-link" onClick={onBack}>← Quay lại</button><p>Chưa có dữ liệu Likert hợp lệ để phân tích.</p></div>;

  const toggleAction = index => { setCheckedActions(current => ({ ...current, [index]: !current[index] })); setSaved(false); };
  const chosenCount = Object.values(checkedActions).filter(Boolean).length;
  const savePlan = () => {
    const storageKey = 'nexusImprovementPlans';
    const selectedActions = selected.actions.filter((_, index) => checkedActions[index]);
    let plans = [];
    try { plans = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { plans = []; }
    const planId = `${program}:${selected.code}`;
    const plan = {
      id: planId, program: program === '__ALL__' ? 'Tất cả hoạt động' : program,
      itemCode: selected.code, issue: selected.issue,
      evidence: { n: selected.n, performance: selected.performance, importance: selected.importance, negativeComments: selected.negativeEvidence.length },
      actions: selectedActions, metric: selected.metric, target: selected.target,
      status: 'Chờ triển khai', savedAt: new Date().toLocaleString('vi-VN')
    };
    localStorage.setItem(storageKey, JSON.stringify([...plans.filter(entry => entry.id !== planId), plan]));
    setSaved(true);
  };
  const displayedEvidence = [...selected.evidence].sort((a, b) => (a.sentiment === 'Tiêu cực' ? -1 : 1) - (b.sentiment === 'Tiêu cực' ? -1 : 1)).slice(0, 8);

  return (
    <div className="admin-subpage nexus-page">
      <button className="admin-back-link" onClick={onBack}>← Quay lại</button>
      <div className="admin-subpage__heading nexus-heading">
        <div><h1>NEXUS — Từ phản hồi thật đến hành động</h1><p>Đang phân tích {responses.length} phiếu · 21 tiêu chí + 1 điểm tổng thể · 4 trường phản hồi mở</p></div>
        <div className="nexus-filter-row">
          <label className="nexus-program-filter">Hoạt động<select value={program} onChange={event => setProgram(event.target.value)}><option value="__ALL__">Tất cả hoạt động</option>{programs.map(name => <option key={name}>{name}</option>)}</select></label>
          <label className="nexus-program-filter">Nhóm thang đo<select value={factorCode} onChange={event => setFactorCode(event.target.value)}><option value="__ALL__">Tất cả nhóm</option>{factors.map(factor => <option key={factor.code} value={factor.code}>{factor.name}</option>)}</select></label>
        </div>
      </div>
      <div className="nexus-method-note"><strong>Phương pháp:</strong> Importance là tương quan thực tế với mức hài lòng tổng thể và được chuẩn hóa tương đối; Performance là điểm trung bình Likert. Bộ phân loại cố định đã được rà soát trên 1.176 lượt trả lời mở, tương ứng 591 nội dung duy nhất sau chuẩn hóa (12/09/2026).</div>
      <div className="nexus-flow"><span>Điểm Likert thật</span><b>→</b><span>Phản hồi mở thật</span><b>→</b><span>Joint Display</span><b>→</b><span>Kho hành động</span><b>→</b><span>Đo lại</span></div>
      <div className="nexus-layout">
        <aside className="nexus-priority-list">
          <div className="nexus-panel-title">Ranking — Cần sửa gì trước?</div>
          <div className="nexus-priority-scroll">{visibleInsights.map((item, index) => (
            <button key={item.code} className={`nexus-priority-item${selected.code === item.code ? ' is-active' : ''}`} onClick={() => { setSelectedCode(item.code); setCheckedActions({}); setSaved(false); }}>
              <span className="nexus-priority-rank">#{index + 1}</span><span className="nexus-priority-copy"><strong>{item.code} — {item.label}</strong><small>{item.performance.toFixed(2)}/7 · ảnh hưởng {Math.round(item.importance * 100)}% · n={item.n}</small></span><span className={`nexus-status nexus-status--${item.classification.tone}`}>{item.classification.label}</span>
            </button>
          ))}</div>
        </aside>
        <main className="nexus-workspace">
          <div className="nexus-summary-row"><div><span>Điểm ưu tiên</span><strong>{selected.priorityScore}/100</strong></div><div><span>Performance</span><strong>{selected.performance.toFixed(2)}/7</strong></div><div><span>Importance tương đối</span><strong>{Math.round(selected.importance * 100)}%</strong></div><div><span>Phản hồi tiêu cực</span><strong>{selected.negativePercent}%</strong></div></div>
          <section className="nexus-joint-card">
            <div className="nexus-panel-title">Joint Display — Vì sao đây là vấn đề?</div>
            <div className="nexus-joint-grid">
              <div className="nexus-evidence-block"><span className="nexus-eyebrow">BẰNG CHỨNG ĐỊNH LƯỢNG · {selected.factor}</span><h3>{selected.code} — {selected.label}</h3><div className="nexus-big-score">{selected.performance.toFixed(2)}<small>/7</small></div><MiniLikertDistribution values={selected.distribution} /><p><strong>{selected.positive}%</strong> đánh giá tích cực (5–7); <strong>{selected.lowRate}%</strong> chấm từ 1–4; cỡ mẫu <strong>n={selected.n}</strong>.</p><p>Mức ảnh hưởng tương đối từ dữ liệu: <strong>{Math.round(selected.importance * 100)}%</strong>. IPMA xếp vào nhóm <strong>{selected.classification.label.toLowerCase()}</strong>.</p></div>
              <div className="nexus-evidence-block nexus-open-evidence"><span className="nexus-eyebrow">PHẢN HỒI MỞ · CHỦ ĐỀ {selected.topic}</span><h3>{selected.evidence.length} đoạn liên quan · {selected.negativeEvidence.length} tiêu cực</h3>{displayedEvidence.length ? displayedEvidence.map((entry, index) => <blockquote key={`${entry.responseId}-${index}`}><span>{entry.source} · <em className={`nexus-sentiment nexus-sentiment--${entry.sentiment === 'Tiêu cực' ? 'negative' : entry.sentiment === 'Tích cực' ? 'positive' : 'neutral'}`}>{entry.sentiment}</em>{entry.rating !== null ? ` · Likert ${entry.rating}/7` : ''}</span>“{entry.text}”</blockquote>) : <p className="nexus-empty">Chưa có phản hồi mở khớp trực tiếp với taxonomy của chủ đề này.</p>}</div>
            </div>
            <div className={`nexus-relation nexus-relation--${selected.relationship.tone}`}><span>KẾT QUẢ TÍCH HỢP: {selected.relationship.label}</span><strong>{selected.relationship.detail}</strong></div>
            <div className="nexus-diagnosis"><span>CHẨN ĐOÁN TỔNG HỢP</span><strong>{selected.diagnosis}</strong></div>
          </section>
          <section className="nexus-action-card">
            <div className="nexus-action-head"><div><span className="nexus-eyebrow">ACTION KNOWLEDGE BASE · {selected.factor}</span><h2>Sửa như thế nào?</h2></div><span className="nexus-knowledge-badge">Giải pháp cố định · Có thể kiểm chứng</span></div>
            <div className="nexus-actions">{selected.actions.map((action, index) => <label key={index} className={checkedActions[index] ? 'is-checked' : ''}><input type="checkbox" checked={!!checkedActions[index]} onChange={() => toggleAction(index)} /><span><b>{index + 1}</b>{action}</span></label>)}</div>
            <div className="nexus-measure"><div><span>Chỉ số theo dõi</span><strong>{selected.metric}</strong></div><div><span>Mục tiêu lần tới</span><strong>{selected.target}</strong></div></div>
            <div className="nexus-plan-footer"><p>{saved ? 'Kế hoạch đã được lưu trong trình duyệt của thiết bị này.' : chosenCount ? `Đã chọn ${chosenCount}/${selected.actions.length} hành động.` : 'Chọn hành động phù hợp để tạo kế hoạch cải thiện.'}</p><button disabled={!chosenCount} onClick={savePlan}>{saved ? '✓ Đã lưu kế hoạch' : 'Lưu kế hoạch cải thiện'}</button></div>
          </section>
        </main>
      </div>
    </div>
  );
}
