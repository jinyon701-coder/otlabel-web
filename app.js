// ==========================================================================
// Otlabel (옷라벨) Main Application Logic
// ==========================================================================

// =============================================================
// 1. 설정: 구글 시트 URL & 제휴 마케팅(Affiliate) 설정
// =============================================================
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1TohouE0HOPXrsH-k5A55Twv3lqsc7bHIH7m74SWRJZ8/export?format=csv";
const FALLBACK_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-_JrM639eTC06eeehdde2pEcvGo4cuxFGNdoIEXgFJjA0Ba5B_4S3FTMmhRympEOmcTojaqn5LOWP/pub?output=csv";

// 제휴 마케팅(Affiliate) 링크 래퍼 설정
const AFFILIATE_CONFIG = {
  enabled: true,
  rules: [
    {
      domainMatch: "coupang.com",
      paramKey: "subid",
      paramValue: "otlabel_ref",
      extraParams: { "redirect": "" }
    },
    {
      domainMatch: "musinsa.com",
      paramKey: "utm_source",
      paramValue: "otlabel",
      extraParams: { "utm_medium": "affiliate", "utm_campaign": "label_compare" }
    },
    {
      domainMatch: "*",
      paramKey: "utm_source",
      paramValue: "otlabel",
      extraParams: { "utm_medium": "referral", "utm_campaign": "spa_label" }
    }
  ]
};

// localStorage 키 상수
const LS_KEY_CLICK_STATS = "otlabel_click_stats";
const LS_KEY_SAVED_LABELS = "otlabel_saved_labels";

// =============================================================
// 2. 데모 데이터 & 섬유 가중치 테이블
// =============================================================
const DEMO_PRODUCTS = [
  { id: 1, brand: "유니클로", name: "수피마 코튼 크루넥T", price: 19900, fabric: "면(수피마 코튼) 100%", link: "https://www.uniqlo.com/kr/ko/products/E422992-000/00", isSponsored: false, checkedDate: "2026-11-21" },
  { id: 2, brand: "ZARA", name: "소프트 니트 스웨터", price: 49900, fabric: "폴리에스터 58%, 아크릴 36%, 울 6%", link: "https://www.zara.com", isSponsored: false, checkedDate: "2026-11-21" },
  { id: 3, brand: "무신사스탠다드", name: "캐시미어 블렌드 라운드넥 니트", price: 58900, fabric: "울 60%, 캐시미어 10%, 나일론 30%", link: "https://www.musinsa.com/products/996636", isSponsored: false, checkedDate: "2026-11-21" },
  { id: 4, brand: "스파오", name: "클래식 옥스포드 셔츠", price: 29900, fabric: "면 100%", link: "https://spao.com", isSponsored: false, checkedDate: "2026-11-21" },
  { id: 5, brand: "H&M", name: "릴랙스핏 프리미엄 울 블렌드 코트", price: 149000, fabric: "겉감: 울 50%, 폴리에스터 45%, 기타 5% / 안감: 폴리에스터 100%", link: "https://www2.hm.com", isSponsored: false, checkedDate: "2026-11-21" },
  { id: 6, brand: "탑텐", name: "에코 웜 모달 긴팔 티셔츠", price: 15900, fabric: "모달 48%, 면 48%, 폴리우레탄 4%", link: "https://topten.topten10mall.com", isSponsored: false, checkedDate: "2026-11-21" },
  { id: 7, brand: "무신사스탠다드", name: "[시티 레저] 후디드 라이트 다운 재킷 [블랙]", price: 109900, fabric: "겉감: 폴리에스터 100%, 안감: 나일론 100%, 충전재: 덕다운 (오리 솜털 80%, 오리 깃털 20%)", link: "https://www.musinsa.com/products/4356794", isSponsored: false, checkedDate: "2026-11-21" },
  { id: 8, brand: "스파오", name: "[씬라이트] 여성 시어 후드 재킷_SPJPG4TG25", price: 69900, fabric: "겉감: 나일론 100%, 안감: 나일론 100%, 충전재: 폴리에스터 100%", link: "https://www.spao.com/i/item?itemNo=2608016293&lowerVendNo=LV26000002&pageId=1795096632474&preCornerNo=R13720001_categoryItem", isSponsored: false, checkedDate: "2026-11-21" }
];

const FIBER_WEIGHT_TABLE = [
  { regex: /캐시미어|cashmere/i, name: "캐시미어", weight: 100, care: "드라이클리닝 권장, 울 전용 중성세제 미온수 단독 손세탁, 비틀어짜기 금지" },
  { regex: /알파카|alpaca|야크|yak|모헤어|mohair/i, name: "특수모(알파카/야크)", weight: 95, care: "드라이클리닝 권장, 마찰 및 고온 건조 주의" },
  { regex: /실크|silk|(?:^|[^가-힣])견(?:[^가-힣]|$)|견사/i, name: "실크", weight: 95, care: "드라이클리닝 필수, 직사광선 피하고 그늘 건조" },
  { regex: /수피마|supima/i, name: "수피마 코튼", weight: 90, care: "미온수 세탁, 표백제 사용 금지, 고온 건조기 수축 주의" },
  { regex: /울|양모|메리노|merino|lambswool|wool|(?:^|[^가-힣])모(?:[^가-힣]|$)|모혼방|순모/i, name: "울(모)", weight: 85, care: "드라이클리닝 또는 울샴푸 손세탁, 건조기 사용 금지" },
  { regex: /모달|modal|텐셀|tencel|리오셀|lyocell|뱀부|bamboo/i, name: "재생섬유(모달/텐셀)", weight: 80, care: "세탁망 사용 울코스 세탁, 고온 건조기 수축 주의" },
  { regex: /린넨|리넨|linen|마혼방|아마|(?:^|[^가-힣])마(?:[^가-힣]|$)/i, name: "린넨(마)", weight: 80, care: "미온수 중성세제 세탁, 탈수는 약하게, 그늘 건조" },
  { regex: /면|코튼|cotton|순면|면혼방/i, name: "면(코튼)", weight: 75, care: "표준 세탁 가능, 진한 색상 단독 세탁(이염 방지)" },
  { regex: /레이온|rayon|비스코스|viscose/i, name: "레이온", weight: 65, care: "물세탁 시 수축 위험 크므로 드라이클리닝 권장" },
  { regex: /아세테이트|acetate/i, name: "아세테이트", weight: 60, care: "미온수 약한 손세탁 또는 드라이클리닝" },
  { regex: /나일론|nylon|폴리아미드|polyamide/i, name: "나일론", weight: 55, care: "세탁기 표준 세탁 가능, 열에 취약하므로 고온 다림질 금지" },
  { regex: /폴리우레탄|polyurethane|스판|spandex|엘라스테인|elastane/i, name: "스판덱스", weight: 50, care: "염소계 표백제 및 고열 건조 금지 (탄성 손상 방지)" },
  { regex: /폴리에스터|polyester|폴리에스테르|폴리(?!우레탄)/i, name: "폴리에스터", weight: 45, care: "세탁 및 건조 용이, 정전기 방지 유연제 권장" },
  { regex: /아크릴|acrylic/i, name: "아크릴", weight: 35, care: "보풀 및 정전기 주의, 미온수 세탁망 사용 권장" },
  { regex: /다운|down|오리솜털|거위솜털|구스|덕다운|구스다운|깃털|feather/i, name: "다운(솜털/깃털)", weight: 85, care: "다운 전용 중성세제 세탁, 뭉침 방지 건조 후 두드리기" },
  { regex: /가죽|레더|leather|스웨이드|suede/i, name: "천연/합성가죽", weight: 70, care: "가죽 전문 클리닝 필수, 습기 및 직사광선 주의" },
  { regex: /기타|other/i, name: "기타 섬유", weight: 40, care: "표준 세탁법 권장" }
];

// =============================================================
// 2-1. XSS 방지 및 안전한 문자열 변환 유틸
// =============================================================
function escapeHTML(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJS(str) {
  if (str == null) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "\\\"")
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}

// =============================================================
// 3. RFC 4180 표준 CSV 파서
// =============================================================
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

// =============================================================
// 4. 비율(%) 기반 정밀 소재 점수 엔진 및 핵심 소재 파싱
// =============================================================
function extractOuterFabric(str) {
  if (!str || typeof str !== "string") return "";
  
  // 1. 겉감/표면/본체/원단 구획 추출 (안감, 배색, 충전재 등 이전까지)
  const pattern = /(?:\[|\()?(?:겉감|표면|본체|원단)(?:[0-9]?)(?:\]|\))?\s*[:\-]?\s*(.+?)(?=(?:[/|,\n]\s*|\s+)[\[\(]?(?:안감|배색|충전재|소매안감|주머니감|트리밍|시보리|밑단)|$)/i;
  const m = str.match(pattern);
  if (m && m[1] && m[1].trim()) {
    return m[1].trim();
  }

  // 2. 브라켓이나 슬래시 기반 일반 분할 폴백: [겉감] 면 100% / 안감: 폴리 100%
  const fallbackMatch = str.match(/(?:겉감|표면|본체)\s*[:\]\)]?\s*([^/\[\n]+)/i);
  if (fallbackMatch && fallbackMatch[1] && fallbackMatch[1].trim()) {
    return fallbackMatch[1].trim();
  }

  return str;
}

function analyzeFabricEngine(fabricStr) {
  if (!fabricStr || typeof fabricStr !== "string" || fabricStr.trim() === "") {
    return {
      score: 50,
      components: [],
      careTips: ["케어라벨 정보가 입력되지 않았거나 확인이 필요합니다."],
      grade: "정보없음",
      keySummary: "혼용률 확인 필요",
      isOuterOnly: false
    };
  }

  const cleanInput = fabricStr.trim();
  
  // 확인 필요 키워드 체크
  const isUnconfirmed = /상세\s*라벨|상세\s*페이지|확인\s*필요|확인\s*권장|라벨\s*참조|정보\s*없음|정보없음|미표기|혼용률\s*확인/i.test(cleanInput);

  const outerStr = extractOuterFabric(cleanInput);

  // 퍼센트 추출 정규식:
  // 포맷 1: "면 100%", "면: 100%", "울 60%", "Nylon 100%" 등 (소재명 + 퍼센트)
  const regexNormal = /([가-힣a-zA-Z\(\)\/]+(?:\s+[가-힣a-zA-Z\(\)\/]+)?)\s*[:=\-]?\s*(\d{1,3}(?:\.\d+)?)\s*%/g;
  let matches = [...outerStr.matchAll(regexNormal)];

  // 포맷 2: "100% Cotton", "100% 면" 등 (퍼센트 + 소재명)
  let isPrefixFormat = false;
  if (matches.length === 0) {
    const regexPrefix = /(\d{1,3}(?:\.\d+)?)\s*%\s*[:=\-]?\s*([가-힣a-zA-Z\(\)\/]+(?:\s+[가-힣a-zA-Z\(\)\/]+)?)/g;
    const prefixMatches = [...outerStr.matchAll(regexPrefix)];
    if (prefixMatches.length > 0) {
      matches = prefixMatches;
      isPrefixFormat = true;
    }
  }

  const components = [];
  let totalPercent = 0;
  let weightedSum = 0;
  const tipSet = new Set();

  for (const m of matches) {
    let rawName = (isPrefixFormat ? m[2] : m[1]) || "";
    const rawVal = isPrefixFormat ? m[1] : m[2];

    // 불필요한 단어 및 앞뒤 특수기호 제거
    rawName = rawName.trim()
      .replace(/^[\[\(]?(?:겉감|안감|배색|충전재|원단|표면|본체)[0-9]?[\]\)]?[:\s\-]*/g, "")
      .replace(/^[^가-힣a-zA-Z]+|[^가-힣a-zA-Z]+$/g, "")
      .trim();

    if (!rawName) continue;

    const percent = parseFloat(rawVal);
    if (isNaN(percent) || percent <= 0 || percent > 100) continue;

    const matchedFiber = FIBER_WEIGHT_TABLE.find(f => f.regex.test(rawName));
    const weight = matchedFiber ? matchedFiber.weight : 45;
    const displayName = matchedFiber ? matchedFiber.name : rawName;
    const care = matchedFiber ? matchedFiber.care : "표준 세탁법 준수";

    // 동일 소재명이 이미 있으면 비율 합산 (예: 면 60%, 면 10%)
    const existing = components.find(c => c.name === displayName);
    if (existing) {
      existing.percent = Math.round((existing.percent + percent) * 10) / 10;
    } else {
      components.push({ name: displayName, rawName, percent, weight });
    }

    weightedSum += (percent * weight);
    totalPercent += percent;
    tipSet.add(`${displayName}: ${care}`);
  }

  // 퍼센트 높은 순으로 정렬
  components.sort((a, b) => b.percent - a.percent);

  let score = 50;
  let hasValidData = false;

  if (totalPercent > 0) {
    score = Math.round(weightedSum / totalPercent);
    hasValidData = true;
  } else {
    // 백분율이 없을 경우 텍스트 내 포함된 섬유 키워드로 가중치 추정
    let sumW = 0, count = 0;
    for (const item of FIBER_WEIGHT_TABLE) {
      if (item.name === "기타 섬유") continue;
      if (item.regex.test(outerStr)) {
        sumW += item.weight;
        count++;
        tipSet.add(`${item.name}: ${item.care}`);
      }
    }
    if (count > 0) {
      score = Math.round(sumW / count);
      hasValidData = true;
    }
  }

  score = Math.max(15, Math.min(100, isNaN(score) ? 50 : score));

  let grade = "보통";
  if (!hasValidData && isUnconfirmed) {
    grade = "확인필요";
    score = 50;
  } else if (score >= 88) {
    grade = "최상급 천연";
  } else if (score >= 75) {
    grade = "우수 퀄리티";
  } else if (score >= 60) {
    grade = "실용 혼방";
  } else {
    grade = "가성비 합섬";
  }

  let careTips = Array.from(tipSet);
  if (careTips.length === 0) {
    careTips = isUnconfirmed
      ? ["제품 라벨 또는 공식 상세페이지의 세탁 표기 사항을 확인해 주세요."]
      : ["중성세제를 사용한 일반 미온수 세탁을 권장합니다."];
  }

  // 천연섬유 분류 기준(면·울·캐시미어·린넨·마·견 등) 합산 비중 산출
  const NATURAL_FIBER_REGEX = /면|코튼|cotton|울|모|양모|메리노|merino|lambswool|wool|캐시미어|cashmere|알파카|alpaca|야크|yak|모헤어|mohair|린넨|리넨|linen|마|마혼방|견|실크|silk|다운|down|솜털|깃털|구스|덕/i;
  let naturalPercent = 0;
  for (const c of components) {
    if (NATURAL_FIBER_REGEX.test(c.name) || NATURAL_FIBER_REGEX.test(c.rawName)) {
      naturalPercent += c.percent;
    }
  }
  naturalPercent = Math.min(100, Math.round(naturalPercent * 10) / 10);

  // 핵심 하이라이트 배지 텍스트 (예: "면 100%", "울 60% · 캐시미어 10%")
  let keySummary = "";
  if (components.length > 0) {
    keySummary = components.slice(0, 2).map(c => `${c.name} ${c.percent}%`).join(" · ");
  } else if (isUnconfirmed) {
    keySummary = "상세 라벨 확인 권장";
  } else {
    keySummary = cleanInput.length > 25 ? cleanInput.substring(0, 25) + "..." : cleanInput;
  }

  return {
    score,
    naturalPercent,
    components,
    careTips,
    grade,
    keySummary,
    isOuterOnly: outerStr !== fabricStr
  };
}

function calculateCostPerformance(score, price) {
  if (!price || price <= 0 || !isFinite(price) || isNaN(price) || !isFinite(score) || isNaN(score)) return 0;
  return Math.round((score / price) * 10000 * 10) / 10;
}

// =============================================================
// 5. 제휴 마케팅 아웃바운드 링크 래퍼 & 클릭 트래킹
// =============================================================
function buildAffiliateLink(originalUrl) {
  if (!AFFILIATE_CONFIG.enabled || !originalUrl || originalUrl === "#") return originalUrl;
  try {
    const url = new URL(originalUrl);
    let matchedRule = null;
    for (const rule of AFFILIATE_CONFIG.rules) {
      if (rule.domainMatch === "*") { matchedRule = matchedRule || rule; continue; }
      if (url.hostname.includes(rule.domainMatch)) { matchedRule = rule; break; }
    }
    if (matchedRule) {
      url.searchParams.set(matchedRule.paramKey, matchedRule.paramValue);
      if (matchedRule.extraParams) {
        for (const [k, v] of Object.entries(matchedRule.extraParams)) {
          if (v !== "") url.searchParams.set(k, v);
        }
      }
    }
    return url.toString();
  } catch (e) {
    return originalUrl;
  }
}

function trackOutboundClick(brand, productName) {
  console.log(`[옷라벨 Affiliate] 아웃바운드 클릭 → 브랜드: ${brand}, 상품: ${productName}`);
  try {
    const stats = JSON.parse(localStorage.getItem(LS_KEY_CLICK_STATS) || "{}");
    const key = `${brand}||${productName}`;
    stats[key] = (stats[key] || 0) + 1;
    stats._totalClicks = (stats._totalClicks || 0) + 1;
    stats._lastClickAt = new Date().toISOString();
    localStorage.setItem(LS_KEY_CLICK_STATS, JSON.stringify(stats));
  } catch (e) {}
}

window.handleOutboundClick = function(brand, productName, originalLink) {
  trackOutboundClick(brand, productName);
  const affiliateUrl = buildAffiliateLink(originalLink);
  window.open(affiliateUrl, "_blank", "noopener,noreferrer");
};

// =============================================================
// 6. 최근 분석한 내 라벨 로컬 저장 (LocalStorage)
// =============================================================
function loadSavedLabels() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY_SAVED_LABELS) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (e) { return []; }
}

function saveLabelToStorage(item) {
  try {
    const list = loadSavedLabels();
    const existIdx = list.findIndex(l => l.fabric === item.fabric && l.name === item.name);
    const entry = {
      id: item.id,
      name: item.name,
      price: item.price,
      fabric: item.fabric,
      score: item.score,
      costPerf: item.costPerf,
      grade: item.analysis?.grade || "",
      savedAt: new Date().toISOString()
    };
    if (existIdx > -1) {
      list[existIdx] = entry;
    } else {
      list.unshift(entry);
    }
    if (list.length > 20) list.length = 20;
    localStorage.setItem(LS_KEY_SAVED_LABELS, JSON.stringify(list));
  } catch (e) {}
}

function deleteSavedLabel(savedId) {
  try {
    let list = loadSavedLabels();
    list = list.filter(l => l.id !== savedId);
    localStorage.setItem(LS_KEY_SAVED_LABELS, JSON.stringify(list));
  } catch (e) {}
}

function clearAllSavedLabels() {
  try { localStorage.removeItem(LS_KEY_SAVED_LABELS); } catch (e) {}
}

function restoreSavedLabelsToProducts() {
  const saved = loadSavedLabels();
  if (!Array.isArray(saved)) return;
  saved.forEach(s => {
    if (!s || !s.id || !s.name) return;
    if (!products.some(p => p.id === s.id)) {
      const fabricText = s.fabric || "상세 라벨 확인 권장";
      const analysis = analyzeFabricEngine(fabricText);
      const priceVal = typeof s.price === "number" ? s.price : (parseInt(s.price, 10) || 0);
      products.push({
        id: s.id,
        brand: s.brand || "자체분석",
        category: detectCategory(s.name, fabricText),
        name: s.name,
        price: priceVal,
        fabric: fabricText,
        analysis: analysis,
        score: analysis.score,
        costPerf: calculateCostPerformance(analysis.score, priceVal),
        link: "#",
        isSponsored: false,
        _fromSaved: true
      });
    }
  });
}

function renderSavedLabelsUI() {
  const section = document.getElementById("saved-labels-section");
  const listEl = document.getElementById("saved-labels-list");
  if (!section || !listEl) return;
  const saved = loadSavedLabels();

  if (saved.length === 0) {
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");
  listEl.innerHTML = "";

  saved.forEach(s => {
    if (!s || !s.id) return;
    const safeName = escapeHTML(s.name);
    const safeFabric = escapeHTML(s.fabric);
    const row = document.createElement("div");
    row.className = "flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs";
    row.innerHTML = `
      <div class="flex-1 min-w-0">
        <div class="font-bold text-gray-800 truncate">${safeName}</div>
        <div class="text-[10px] text-gray-500 truncate">${safeFabric}</div>
      </div>
      <div class="flex items-center gap-2 ml-2 shrink-0">
        <span class="text-[10px] font-black text-indigo-600">${s.score || 50}점</span>
        <button onclick="handleDeleteSavedLabel(${s.id})" class="text-[10px] text-red-400 hover:text-red-600 transition-colors cursor-pointer" title="삭제">
          <i class="fa-solid fa-trash-can"></i>
        </button>
        <button onclick="handleRestoreSavedToCompare(${s.id})" class="text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer" title="맞대결 담기">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    `;
    listEl.appendChild(row);
  });
}

window.handleDeleteSavedLabel = function(savedId) {
  deleteSavedLabel(savedId);
  products = products.filter(p => !(p.id === savedId && p._fromSaved));
  renderSavedLabelsUI();
  renderProductCards();
  showToast("저장된 분석 라벨이 삭제되었습니다.");
};

window.handleRestoreSavedToCompare = function(savedId) {
  const item = products.find(p => p.id === savedId);
  if (!item) return;
  const idx = compareList.findIndex(p => p.id === savedId);
  if (idx === -1 && compareList.length >= 2) {
    showToast("맞대결은 최대 2개 상품까지만 가능합니다!");
    return;
  }
  if (idx === -1) {
    compareList.push(item);
    showToast(`'${item.name}'이(가) 맞대결에 담겼습니다!`);
  } else {
    showToast("이미 맞대결 리스트에 담겨 있습니다.");
  }
  updateCompareUI();
  renderProductCards();
};

// =============================================================
// 7. 맞대결 결과 공유 & 딥링크 (바이럴 루프)
// =============================================================
function generateShareLink() {
  if (compareList.length !== 2) return null;
  try {
    const ids = compareList.map(p => p.id).join(",");
    const url = new URL(window.location.href.split("?")[0]);
    url.searchParams.set("compare", ids);
    return url.toString();
  } catch (e) {
    return window.location.href;
  }
}

function generateShareText() {
  if (compareList.length !== 2) return "";
  const [a, b] = compareList;
  const aNat = a.analysis?.naturalPercent || 0;
  const bNat = b.analysis?.naturalPercent || 0;
  const natDiff = Math.abs(Math.round((aNat - bNat) * 10) / 10);
  let fabricText = "천연섬유 분류 비중 동일";
  if (aNat > bNat) {
    fabricText = `천연섬유 분류 비중 ${a.brand} ${natDiff}%p 높음`;
  } else if (bNat > aNat) {
    fabricText = `천연섬유 분류 비중 ${b.brand} ${natDiff}%p 높음`;
  }
  return `[옷라벨 1:1 비교] ${a.brand} vs ${b.brand} (공식 온라인몰 표기 기준)\n• 표시 소재 혼용률 비교: ${fabricText} (${a.brand} ${aNat}% vs ${b.brand} ${bNat}%)\n• 가성비 환산 지수: ${a.costPerf} pt vs ${b.costPerf} pt\n※ 공식 온라인몰 공시 혼용률 기반의 객관적 분석 지표입니다.\n`;
}

async function shareCompareResult() {
  if (compareList.length !== 2) {
    showToast("2개 상품을 담아야 공유할 수 있습니다.");
    return;
  }
  const link = generateShareLink();
  const text = generateShareText();
  if (!link) {
    showToast("공유 링크 생성에 실패했습니다.");
    return;
  }
  const fullText = text + link;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(fullText);
      showToast("맞대결 링크가 복사되었습니다! 친구나 단톡방에 공유해 보세요 🔗");
      return;
    }
    throw new Error("Clipboard API unavailable");
  } catch (e) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = fullText;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) {
        showToast("맞대결 링크가 복사되었습니다! 친구나 단톡방에 공유해 보세요 🔗");
      } else {
        showToast("URL 복사에 실패했습니다. 브라우저 주소를 직접 복사해 주세요.");
      }
    } catch (e2) {
      showToast("URL 복사에 실패했습니다. 브라우저 주소를 직접 복사해 주세요.");
    }
  }
}

function handleDeepLinkOnLoad() {
  try {
    const params = new URLSearchParams(window.location.search);
    const compareParam = params.get("compare");
    if (!compareParam) return;

    const ids = compareParam.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (ids.length === 0) return;

    setTimeout(() => {
      compareList = [];
      ids.slice(0, 2).forEach(id => {
        const item = products.find(p => p.id === id);
        if (item && !compareList.some(c => c.id === item.id)) {
          compareList.push(item);
        }
      });
      if (compareList.length > 0) {
        updateCompareUI();
        renderProductCards();
        openModal();
      }
    }, 300);
  } catch (e) {
    console.warn("[옷라벨] 딥링크 파싱 예외 처리:", e);
  }
}

// =============================================================
// 8. 앱 상태 관리 & 카테고리 판별 유틸
// =============================================================
let products = [];
let compareList = [];
let selectedBrand = "ALL";
let selectedCategory = "ALL";
let selectedSort = "recommended";
let customProductCounter = 1000;
let latestAnalyzedCustom = null;

function detectCategory(name, fabric) {
  const text = `${name} ${fabric}`.toLowerCase();
  if (/다운|패딩|재킷|자켓|코트|블레이저|점퍼|파카|점퍼|cardigan|가디건|아우터/i.test(text)) {
    return "아우터";
  }
  if (/니트|스웨터|셔츠|티셔츠|맨투맨|후드|스웨트|크루넥|t-shirt|shirt|sweater/i.test(text)) {
    return "상의";
  }
  if (/슬랙스|팬츠|바지|데님|청바지|진|쇼츠|반바지|스커트|치마|pants|jeans/i.test(text)) {
    return "하의";
  }
  if (/이너|양말|히트텍|웜모달|브라|팬티|내의|underwear/i.test(text)) {
    return "이너/기타";
  }
  return "기타";
}

// =============================================================
// 8-1. 저작권 안전 고품질 스튜디오 비주얼 시스템 (SVG 실시간 생성 엔진)
// =============================================================

// 브랜드별 시그니처 컬러 및 스타일 맵 (유니클로, 무신사스탠다드, 스파오, 탑텐, ZARA, 지오다노, H&M 등)
const BRAND_STYLE_MAP = {
  "유니클로": {
    primary: "#ED1D24",
    accent: "#FFFFFF",
    bgGradient: "from-red-50/70 via-rose-50/40 to-white",
    badgeBg: "bg-[#ED1D24] text-white",
    border: "border-red-100",
    name: "UNIQLO"
  },
  "무신사스탠다드": {
    primary: "#111111",
    accent: "#64748B", // 슬레이트
    bgGradient: "from-gray-100/80 via-slate-50/50 to-white",
    badgeBg: "bg-[#111111] text-white",
    border: "border-gray-200",
    name: "MUSINSA STANDARD"
  },
  "스파오": {
    primary: "#003876",
    accent: "#3B82F6", // 소프트네이비/블루
    bgGradient: "from-blue-50/70 via-sky-50/40 to-white",
    badgeBg: "bg-[#003876] text-white",
    border: "border-blue-100",
    name: "SPAO"
  },
  "탑텐": {
    primary: "#D71920",
    accent: "#374151", // 차콜
    bgGradient: "from-rose-50/70 via-stone-50/40 to-white",
    badgeBg: "bg-[#D71920] text-white",
    border: "border-rose-100",
    name: "TOPTEN10"
  },
  "zara": {
    primary: "#000000",
    accent: "#D4AF37", // 골드베이지
    bgGradient: "from-amber-50/60 via-neutral-50/50 to-white",
    badgeBg: "bg-black text-amber-300",
    border: "border-amber-100",
    name: "ZARA"
  },
  "지오다노": {
    primary: "#1E3A8A",
    accent: "#6B7280", // 그레이
    bgGradient: "from-blue-50/70 via-slate-50/50 to-white",
    badgeBg: "bg-[#1E3A8A] text-white",
    border: "border-blue-100",
    name: "GIORDANO"
  },
  "h&m": {
    primary: "#E50010",
    accent: "#71717A", // 로즈그레이
    bgGradient: "from-red-50/60 via-zinc-50/50 to-white",
    badgeBg: "bg-[#E50010] text-white",
    border: "border-red-100",
    name: "H&M"
  }
};

function getBrandStyle(brand) {
  const clean = (brand || "").trim().toLowerCase();
  for (const key in BRAND_STYLE_MAP) {
    if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
      return BRAND_STYLE_MAP[key];
    }
  }
  return {
    primary: "#4F46E5",
    accent: "#818CF8",
    bgGradient: "from-indigo-50/70 via-purple-50/40 to-white",
    badgeBg: "bg-indigo-600 text-white",
    border: "border-indigo-100",
    name: brand || "Otlabel"
  };
}

// 섬유별 대표 컬러 맵 (원단 주요 혼용률 미니 그래픽 투톤/멀티톤 바)
const FIBER_COLOR_MAP = {
  "면": "#2563EB",       // Blue (코튼)
  "수피마": "#1D4ED8",
  "울": "#7C3AED",       // Purple (모/양모)
  "캐시미어": "#6D28D9",
  "특수모": "#8B5CF6",
  "실크": "#D97706",     // Amber (견)
  "린넨": "#059669",     // Emerald (마)
  "모달": "#0D9488",     // Teal (재생섬유)
  "텐셀": "#0F766E",
  "레이온": "#14B8A6",
  "폴리에스터": "#64748B", // Slate (합성섬유)
  "나일론": "#0284C7",   // Sky
  "스판덱스": "#DB2777", // Pink (폴리우레탄)
  "다운": "#EA580C",     // Orange (충전재)
  "가죽": "#92400E",
  "기타": "#9CA3AF"      // Gray
};

function getFiberColor(name) {
  const n = (name || "").toLowerCase();
  for (const k in FIBER_COLOR_MAP) {
    if (n.includes(k.toLowerCase())) return FIBER_COLOR_MAP[k];
  }
  return "#9CA3AF";
}

function getFabricSummary(analysis) {
  if (!analysis) return "라벨 확인 권장";
  if (Array.isArray(analysis.components) && analysis.components.length > 0) {
    if (analysis.components.length === 1 && analysis.components[0].percent === 100) {
      return `${analysis.components[0].name} 100% (단일 소재)`;
    }
    return analysis.components.slice(0, 2).map(c => `${c.name} ${c.percent}%`).join(" · ");
  }
  return analysis.keySummary || "라벨 확인 권장";
}

function getFabricMiniProgressBar(analysis) {
  if (!analysis || !Array.isArray(analysis.components) || analysis.components.length === 0) {
    const score = analysis?.score || 50;
    return `<div style="width: ${score}%; background-color: #6366f1;" class="h-full rounded-full transition-all" title="소재 환산 지표 ${score}점"></div>`;
  }
  
  return analysis.components.map(c => {
    const color = getFiberColor(c.name);
    return `<div style="width: ${c.percent}%; background-color: ${color};" class="h-full transition-all" title="${escapeHTML(c.name)} ${c.percent}%"></div>`;
  }).join("");
}

function detectDetailedApparelType(category, name = "", fabric = "") {
  const text = `${category || ""} ${name || ""} ${fabric || ""}`.toLowerCase();

  // 1. 패딩 / 다운
  if (/다운|패딩|푸퍼|puffer|down\s*jacket|충전재|오리솜털|거위솜털|씬라이트|파카/i.test(text)) {
    return "padding";
  }
  // 2. 코트
  if (/코트|coat|트렌치|발마칸|싱글코트|더블코트|울코트/i.test(text)) {
    return "coat";
  }
  // 3. 자켓 / 블레이저
  if (/자켓|재킷|블레이저|blazer|jacket|테일러드|수트|라이더|가디건|cardigan/i.test(text)) {
    return "jacket";
  }
  // 4. 니트 / 스웨터
  if (/니트|스웨터|풀오버|sweater|knit|메리노|램스울|캐시미어|터틀넥/i.test(text)) {
    return "knit";
  }
  // 5. 셔츠
  if (/셔츠|드레스셔츠|옥스포드|카라티|shirt|oxford|남방/i.test(text)) {
    return "shirt";
  }
  // 6. 데님 / 청바지
  if (/데님|청바지|진|jeans|denim/i.test(text)) {
    return "denim";
  }
  // 7. 팬츠 / 슬랙스
  if (/슬랙스|팬츠|바지|치노|쇼츠|반바지|slacks|pants|trousers/i.test(text)) {
    return "slacks";
  }
  // 8. 이너 / 기능성
  if (/히트텍|웜모달|에어리즘|내의|속옷|underwear|양말|socks|브라|팬티|쿨에어/i.test(text)) {
    return "inner";
  }
  // 9. 티셔츠 / 맨투맨
  if (/티셔츠|t-shirt|티|크루넥|맨투맨|후드|스웨트|sweat/i.test(text)) {
    return "tshirt";
  }

  // 기본 카테고리 fallback
  if (category === "아우터") return "jacket";
  if (category === "하의") return "slacks";
  if (category === "상의") return "tshirt";
  if (category === "이너/기타") return "inner";
  return "tshirt";
}

let _svgUniqueCounter = 0;

/**
 * 고품질 스튜디오 스타일 SVG 의류 일러스트레이션 실시간 생성 엔진
 * @param {string} category 카테고리 (상의, 하의, 아우터, 티셔츠, 셔츠, 니트 등)
 * @param {string} brand 브랜드 (유니클로, 무신사스탠다드, 스파오, 탑텐, ZARA, 지오다노 등)
 * @param {string} fabric 공식 케어라벨 혼용률 텍스트
 * @param {object} analysis 케어라벨 분석 객체
 * @param {object} options 추가 렌더링 옵션 ({ size: 'card'|'modal', name: '...' })
 * @returns {string} 고해상도 반응형 SVG 마크업 문자열
 */
function getCategoryVisualSVG(category, brand, fabric, analysis, options = {}) {
  _svgUniqueCounter++;
  const uid = `otl_${Date.now()}_${_svgUniqueCounter}`;
  const brandStyle = getBrandStyle(brand);
  const apparelType = detectDetailedApparelType(category, options.name || "", fabric || "");

  let garmentStartColor = "#FFFFFF";
  let garmentEndColor = "#E2E8F0";
  let strokeColor = "#475569";
  let highlightColor = brandStyle.accent || "#FFFFFF";

  switch (apparelType) {
    case "denim":
      garmentStartColor = "#2563EB";
      garmentEndColor = "#1E3A8A";
      strokeColor = "#0F172A";
      highlightColor = "#D97706";
      break;
    case "padding":
      garmentStartColor = "#475569";
      garmentEndColor = "#0F172A";
      strokeColor = "#020617";
      highlightColor = brandStyle.primary;
      break;
    case "jacket":
      garmentStartColor = "#334155";
      garmentEndColor = "#1E293B";
      strokeColor = "#0F172A";
      highlightColor = brandStyle.primary;
      break;
    case "coat":
      garmentStartColor = "#475569";
      garmentEndColor = "#1E293B";
      strokeColor = "#0F172A";
      highlightColor = brandStyle.accent;
      break;
    case "knit":
      garmentStartColor = "#FEF3C7";
      garmentEndColor = "#CBD5E1";
      strokeColor = "#64748B";
      highlightColor = brandStyle.primary;
      break;
    case "slacks":
      garmentStartColor = "#334155";
      garmentEndColor = "#1E293B";
      strokeColor = "#0F172A";
      highlightColor = brandStyle.accent;
      break;
    case "shirt":
      garmentStartColor = "#FFFFFF";
      garmentEndColor = "#E2E8F0";
      strokeColor = "#64748B";
      highlightColor = brandStyle.primary;
      break;
    case "inner":
      garmentStartColor = "#F8FAFC";
      garmentEndColor = "#E2E8F0";
      strokeColor = "#64748B";
      highlightColor = brandStyle.primary;
      break;
    case "tshirt":
    default:
      garmentStartColor = "#FFFFFF";
      garmentEndColor = "#E2E8F0";
      strokeColor = "#64748B";
      highlightColor = brandStyle.primary;
      break;
  }

  let silhouettePaths = "";

  if (apparelType === "tshirt") {
    silhouettePaths = `
      <path d="M100 36 L68 48 L54 78 L72 86 L84 66 L86 140 L154 140 L156 66 L168 86 L186 78 L172 48 L140 36 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M100 36 Q120 48 140 36" fill="none" stroke="${brandStyle.primary}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M103 39 Q120 46 137 39" fill="none" stroke="#CBD5E1" stroke-width="1" stroke-linecap="round"/>
      <line x1="54" y1="78" x2="72" y2="86" stroke="${highlightColor}" stroke-width="2" stroke-linecap="round"/>
      <line x1="186" y1="78" x2="168" y2="86" stroke="${highlightColor}" stroke-width="2" stroke-linecap="round"/>
      <line x1="86" y1="136" x2="154" y2="136" stroke="#CBD5E1" stroke-width="1.5"/>
      <rect x="130" y="62" width="16" height="18" rx="2" fill="none" stroke="${brandStyle.primary}" stroke-width="1.2" opacity="0.75"/>
    `;
  } else if (apparelType === "shirt") {
    silhouettePaths = `
      <path d="M96 34 L66 48 L52 84 L70 90 L80 66 L84 142 Q120 146 156 142 L160 66 L170 90 L188 84 L174 48 L144 34 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="120" y1="46" x2="120" y2="144" stroke="#CBD5E1" stroke-width="2"/>
      <circle cx="120" cy="62" r="1.8" fill="#FFFFFF" stroke="#64748B" stroke-width="1"/>
      <circle cx="120" cy="82" r="1.8" fill="#FFFFFF" stroke="#64748B" stroke-width="1"/>
      <circle cx="120" cy="102" r="1.8" fill="#FFFFFF" stroke="#64748B" stroke-width="1"/>
      <circle cx="120" cy="122" r="1.8" fill="#FFFFFF" stroke="#64748B" stroke-width="1"/>
      <path d="M96 34 L120 46 L108 52 L96 34 Z" fill="#FFFFFF" stroke="${brandStyle.primary}" stroke-width="1.8"/>
      <path d="M144 34 L120 46 L132 52 L144 34 Z" fill="#FFFFFF" stroke="${brandStyle.primary}" stroke-width="1.8"/>
      <circle cx="120" cy="43" r="1.5" fill="${brandStyle.primary}"/>
      <path d="M134 68 L152 68 L152 88 L143 94 L134 88 Z" fill="none" stroke="${highlightColor}" stroke-width="1.4" opacity="0.85"/>
    `;
  } else if (apparelType === "knit") {
    silhouettePaths = `
      <path d="M98 35 L60 48 L42 98 L58 104 L74 72 L80 140 L160 140 L166 72 L182 104 L198 98 L180 48 L142 35 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M98 35 Q120 45 142 35" fill="none" stroke="${brandStyle.primary}" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="80" y="133" width="80" height="7" rx="2" fill="none" stroke="${brandStyle.primary}" stroke-width="1.6"/>
      <line x1="42" y1="98" x2="58" y2="104" stroke="${brandStyle.primary}" stroke-width="2.5"/>
      <line x1="198" y1="98" x2="182" y2="104" stroke="${brandStyle.primary}" stroke-width="2.5"/>
      <line x1="104" y1="56" x2="104" y2="128" stroke="#94A3B8" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>
      <line x1="120" y1="50" x2="120" y2="128" stroke="${highlightColor}" stroke-width="1.4" stroke-dasharray="4,2" opacity="0.85"/>
      <line x1="136" y1="56" x2="136" y2="128" stroke="#94A3B8" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>
    `;
  } else if (apparelType === "jacket") {
    silhouettePaths = `
      <path d="M96 34 L56 48 L44 98 L60 102 L74 68 L78 142 L162 142 L166 68 L180 102 L196 98 L184 48 L144 34 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M96 34 L110 68 L100 70 L118 96 L120 142" fill="none" stroke="#E2E8F0" stroke-width="1.8"/>
      <path d="M144 34 L130 68 L140 70 L122 96 L120 142" fill="none" stroke="#E2E8F0" stroke-width="1.8"/>
      <circle cx="120" cy="104" r="2.2" fill="${brandStyle.primary}" stroke="#CBD5E1" stroke-width="1"/>
      <circle cx="120" cy="120" r="2.2" fill="${brandStyle.primary}" stroke="#CBD5E1" stroke-width="1"/>
      <rect x="134" y="66" width="18" height="4" rx="1" fill="#FFFFFF" stroke="${brandStyle.primary}" stroke-width="1"/>
      <path d="M140 66 L144 59 L148 66 Z" fill="${highlightColor}"/>
      <rect x="86" y="112" width="22" height="5" rx="1.5" fill="none" stroke="#CBD5E1" stroke-width="1.2"/>
      <rect x="132" y="112" width="22" height="5" rx="1.5" fill="none" stroke="#CBD5E1" stroke-width="1.2"/>
    `;
  } else if (apparelType === "padding") {
    silhouettePaths = `
      <path d="M92 28 Q120 22 148 28 L144 42 Q120 46 96 42 Z" fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8"/>
      <path d="M94 40 L52 52 L36 98 L54 104 L70 74 L74 144 L166 144 L170 74 L186 104 L204 98 L188 52 L146 40 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M72 66 Q120 74 168 66" fill="none" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M73 92 Q120 100 167 92" fill="none" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M74 118 Q120 126 166 118" fill="none" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="120" y1="28" x2="120" y2="144" stroke="${brandStyle.primary}" stroke-width="2.6"/>
      <rect x="118" y="56" width="4" height="8" rx="1.5" fill="${highlightColor}" stroke="#0F172A" stroke-width="0.8"/>
      <line x1="36" y1="98" x2="54" y2="104" stroke="${brandStyle.primary}" stroke-width="3" stroke-linecap="round"/>
      <line x1="204" y1="98" x2="186" y2="104" stroke="${brandStyle.primary}" stroke-width="3" stroke-linecap="round"/>
    `;
  } else if (apparelType === "coat") {
    silhouettePaths = `
      <path d="M96 32 L56 46 L44 96 L60 100 L72 68 L74 148 L166 148 L168 68 L180 100 L196 96 L184 46 L144 32 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M96 32 L112 76 L100 78 L118 110 L120 148" fill="none" stroke="#CBD5E1" stroke-width="2"/>
      <path d="M144 32 L128 76 L140 78 L122 110 L120 148" fill="none" stroke="#CBD5E1" stroke-width="2"/>
      <circle cx="114" cy="94" r="2.2" fill="${brandStyle.primary}" stroke="#FFFFFF" stroke-width="0.8"/>
      <circle cx="126" cy="94" r="2.2" fill="${brandStyle.primary}" stroke="#FFFFFF" stroke-width="0.8"/>
      <circle cx="114" cy="116" r="2.2" fill="${brandStyle.primary}" stroke="#FFFFFF" stroke-width="0.8"/>
      <circle cx="126" cy="116" r="2.2" fill="${brandStyle.primary}" stroke="#FFFFFF" stroke-width="0.8"/>
      <line x1="84" y1="112" x2="98" y2="128" stroke="${highlightColor}" stroke-width="2" stroke-linecap="round"/>
      <line x1="156" y1="112" x2="142" y2="128" stroke="${highlightColor}" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (apparelType === "slacks") {
    silhouettePaths = `
      <rect x="88" y="32" width="64" height="11" rx="2" fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8"/>
      <circle cx="120" cy="37" r="1.6" fill="${brandStyle.primary}"/>
      <line x1="96" y1="32" x2="96" y2="43" stroke="#94A3B8" stroke-width="1.5"/>
      <line x1="144" y1="32" x2="144" y2="43" stroke="#94A3B8" stroke-width="1.5"/>
      <path d="M88 43 L92 144 L114 144 L120 84 L126 144 L148 144 L152 43 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="103" y1="48" x2="103" y2="142" stroke="${highlightColor}" stroke-width="1.4" stroke-dasharray="6,2" opacity="0.85"/>
      <line x1="137" y1="48" x2="137" y2="142" stroke="${highlightColor}" stroke-width="1.4" stroke-dasharray="6,2" opacity="0.85"/>
      <line x1="90" y1="48" x2="98" y2="66" stroke="#94A3B8" stroke-width="1.5"/>
      <line x1="150" y1="48" x2="142" y2="66" stroke="#94A3B8" stroke-width="1.5"/>
    `;
  } else if (apparelType === "denim") {
    silhouettePaths = `
      <rect x="88" y="34" width="64" height="11" rx="2" fill="#1E3A8A" stroke="${strokeColor}" stroke-width="1.8"/>
      <circle cx="120" cy="39" r="2.2" fill="#D97706" stroke="#78350F" stroke-width="0.8"/>
      <circle cx="94" cy="50" r="1.3" fill="#D97706"/>
      <circle cx="146" cy="50" r="1.3" fill="#D97706"/>
      <path d="M88 45 L90 144 L114 144 L120 86 L126 144 L150 144 L152 45 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M88 48 Q100 52 98 66" fill="none" stroke="#D97706" stroke-width="1.5"/>
      <path d="M152 48 Q140 52 142 66" fill="none" stroke="#D97706" stroke-width="1.5"/>
      <rect x="91" y="52" width="6" height="5" rx="0.5" fill="none" stroke="#D97706" stroke-width="1"/>
      <line x1="120" y1="45" x2="120" y2="78" stroke="#D97706" stroke-width="1.4" stroke-dasharray="3,1.5"/>
      <line x1="90" y1="140" x2="114" y2="140" stroke="#D97706" stroke-width="1.4"/>
      <line x1="126" y1="140" x2="150" y2="140" stroke="#D97706" stroke-width="1.4"/>
    `;
  } else if (apparelType === "inner") {
    silhouettePaths = `
      <path d="M102 36 L74 48 L62 82 L78 86 L86 64 L88 140 L152 140 L154 64 L162 86 L178 82 L166 48 L138 36 Z" 
            fill="url(#garmentGrad_${uid})" stroke="${strokeColor}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M102 36 Q120 46 138 36" fill="none" stroke="${brandStyle.primary}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M102 36 Q112 80 102 140" fill="none" stroke="${brandStyle.primary}" stroke-width="1.2" stroke-dasharray="3,1.5" opacity="0.8"/>
      <path d="M138 36 Q128 80 138 140" fill="none" stroke="${brandStyle.primary}" stroke-width="1.2" stroke-dasharray="3,1.5" opacity="0.8"/>
      <rect x="112" y="70" width="16" height="14" rx="2" fill="none" stroke="${highlightColor}" stroke-width="1" stroke-dasharray="2,2" opacity="0.85"/>
    `;
  }

  return `
    <svg viewBox="0 0 240 160" class="w-full h-full drop-shadow-xs select-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="shadow_${uid}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0F172A" stop-opacity="0.25"/>
          <stop offset="60%" stop-color="#0F172A" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#0F172A" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="garmentGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${garmentStartColor}"/>
          <stop offset="60%" stop-color="${garmentStartColor}"/>
          <stop offset="100%" stop-color="${garmentEndColor}"/>
        </linearGradient>
        <linearGradient id="spotlight_${uid}" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- 스튜디오 바닥 은은한 그림자 -->
      <ellipse cx="120" cy="150" rx="${apparelType === 'slacks' || apparelType === 'denim' ? '45' : '65'}" ry="7" fill="url(#shadow_${uid})"/>

      <!-- 스튜디오 미니멀 옷걸이 넥 후크 -->
      <path d="M120 18 C120 10, 132 8, 132 15 C132 21, 120 23, 120 30" fill="none" stroke="#94A3B8" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M78 46 Q120 32 162 46" fill="none" stroke="#CBD5E1" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>

      <!-- 브랜드 시그니처 넥 라벨 포인트 -->
      <rect x="114" y="36" width="12" height="4" rx="1.5" fill="${brandStyle.primary}" stroke="${brandStyle.accent}" stroke-width="0.6"/>
      <circle cx="120" cy="38" r="0.9" fill="${brandStyle.accent}"/>

      <!-- 의류 실루엣 본체 -->
      ${silhouettePaths}

      <!-- 상단 스튜디오 소프트 조명 오버레이 -->
      <circle cx="120" cy="50" r="45" fill="url(#spotlight_${uid})" pointer-events="none"/>
    </svg>
  `.trim();
}

function setupResponsivePCView() {
  const mainContainer = document.getElementById("product-container");
  if (mainContainer && !mainContainer.classList.contains("md:grid")) {
    mainContainer.classList.add("md:grid", "md:grid-cols-2", "xl:grid-cols-3", "gap-3", "sm:gap-3.5", "space-y-0");
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast-message");
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.remove("opacity-0", "-translate-y-2");
  toast.classList.add("opacity-100", "translate-y-0");
  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "-translate-y-2");
  }, 2500);
}

// =============================================================
// 9. 스켈레톤 로더 & 데이터 로드 (실시간 동기화)
// =============================================================
function renderSkeletonLoading() {
  const container = document.getElementById("product-container");
  if (!container) return;
  
  let skeletonHTML = `
    <div class="col-span-full space-y-3 animate-pulse">
      <div class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-center">
        <p class="text-xs font-bold text-indigo-700 flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-spinner fa-spin text-indigo-500"></i>
          <span>실시간 구글 시트 케어라벨 데이터를 동기화 중입니다...</span>
        </p>
      </div>
  `;

  for (let i = 0; i < 4; i++) {
    skeletonHTML += `
      <div class="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3">
        <!-- 썸네일 스켈레톤 -->
        <div class="h-32 w-full rounded-xl skeleton-box mb-1"></div>
        <div class="flex justify-between items-start">
          <div class="space-y-2 flex-1">
            <div class="flex gap-1.5">
              <div class="h-4 w-12 rounded skeleton-box"></div>
              <div class="h-4 w-16 rounded skeleton-box"></div>
            </div>
            <div class="h-5 w-3/4 rounded skeleton-box"></div>
          </div>
          <div class="h-5 w-16 rounded skeleton-box"></div>
        </div>
        <div class="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
          <div class="flex justify-between">
            <div class="h-3 w-20 rounded skeleton-box"></div>
            <div class="h-4 w-12 rounded skeleton-box"></div>
          </div>
          <div class="h-2.5 w-full rounded-full skeleton-box"></div>
          <div class="flex gap-1 pt-1">
            <div class="h-4 w-14 rounded skeleton-box"></div>
            <div class="h-4 w-16 rounded skeleton-box"></div>
          </div>
        </div>
        <div class="flex gap-2 pt-1">
          <div class="h-9 flex-1 rounded-xl skeleton-box"></div>
          <div class="h-9 w-24 rounded-xl skeleton-box"></div>
        </div>
      </div>
    `;
  }
  skeletonHTML += `</div>`;
  container.innerHTML = skeletonHTML;
}

async function fetchSheetCSVWithFallback() {
  const urls = [
    `${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`,
    `${FALLBACK_CSV_URL}${FALLBACK_CSV_URL.includes("?") ? "&" : "?"}t=${Date.now()}`
  ];

  for (const url of urls) {
    let timeoutId = null;
    try {
      console.log(`[옷라벨] 구글 시트 데이터 로드 시도: ${url}`);
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      if (controller) {
        timeoutId = setTimeout(() => controller.abort(), 6000);
      }
      const fetchOptions = {
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      };
      const res = await fetch(url, fetchOptions);
      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const cleanText = text ? text.replace(/^\uFEFF/, '').trim() : '';
        // Google 로그인 / 에러 HTML 응답 차단
        if (cleanText.startsWith("<!DOCTYPE") || cleanText.startsWith("<html") || cleanText.includes("<body")) {
          console.warn(`[옷라벨] HTML 응답 수신 (CSV 아님): ${url}`);
          continue;
        }
        if (cleanText.length > 30) {
          console.log(`[옷라벨] 구글 시트 데이터 로드 성공 (${cleanText.length} bytes)`);
          return cleanText;
        }
      }
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      console.warn(`[옷라벨] 시트 로드 실패 또는 타임아웃 (${url}):`, e);
    }
  }
  return null;
}

async function initData() {
  renderSkeletonLoading();

  try {
    const csvText = await fetchSheetCSVWithFallback();
    
    if (csvText) {
      const rows = parseCSV(csvText);
      // 열 구조: [brand, name, price, fabric, link, isSponsored]
      // 첫 행(헤더) 제외 및 헤더 텍스트 필터링
      const sheetProducts = rows.slice(1)
        .filter(r => r && r[0] && r[1] && !r[0].toLowerCase().includes("brand") && !r[0].includes("브랜드"))
        .map((r, idx) => {
          const rawBrand = (r[0] || "").trim();
          const rawName = (r[1] || "").trim();
          const price = parseInt((r[2] || "").replace(/[^0-9]/g, ""), 10) || 0;
          const fabric = (r[3] || "").trim() || "상세 라벨 확인 권장";
          const analysis = analyzeFabricEngine(fabric);
          const sponsoredRaw = (r[5] || "").trim().toUpperCase();
          const isSponsored = (sponsoredRaw === "TRUE" || sponsoredRaw === "Y" || sponsoredRaw === "1");
          const category = detectCategory(rawName, fabric);

          return {
            id: idx + 1,
            brand: rawBrand,
            category,
            name: rawName,
            price,
            fabric,
            analysis,
            score: analysis.score,
            costPerf: calculateCostPerformance(analysis.score, price),
            link: (r[4] || "").trim() || "#",
            isSponsored,
            checkedDate: (r[6] || "").trim() || "2026-11-21"
          };
        });

      if (sheetProducts.length > 0) {
        // 구글 시트에 아직 없는 데모 상품들 자연스럽게 병합
        let maxId = sheetProducts.length;
        const merged = [...sheetProducts];
        DEMO_PRODUCTS.forEach(dp => {
          const exists = sheetProducts.some(sp => 
            sp.name === dp.name || (dp.link !== "#" && sp.link === dp.link)
          );
          if (!exists) {
            maxId++;
            const analysis = analyzeFabricEngine(dp.fabric);
            merged.push({
              ...dp,
              id: maxId,
              category: detectCategory(dp.name, dp.fabric),
              analysis,
              score: analysis.score,
              costPerf: calculateCostPerformance(analysis.score, dp.price)
            });
          }
        });
        products = merged;
      } else {
        console.warn("[옷라벨] 시트 데이터가 비어있어 기본 데모 상품으로 초기화합니다.");
        products = DEMO_PRODUCTS.map(p => {
          const analysis = analyzeFabricEngine(p.fabric);
          return {
            ...p,
            category: detectCategory(p.name, p.fabric),
            analysis,
            score: analysis.score,
            costPerf: calculateCostPerformance(analysis.score, p.price)
          };
        });
      }
    } else {
      console.warn("[옷라벨] 공개 시트 접근 불가로 데모 상품으로 초기화합니다.");
      products = DEMO_PRODUCTS.map(p => {
        const analysis = analyzeFabricEngine(p.fabric);
        return {
          ...p,
          category: detectCategory(p.name, p.fabric),
          analysis,
          score: analysis.score,
          costPerf: calculateCostPerformance(analysis.score, p.price)
        };
      });
    }
  } catch (err) {
    console.error("[옷라벨] 데이터 초기화 오류, 데모 데이터 사용:", err);
    products = DEMO_PRODUCTS.map(p => {
      const analysis = analyzeFabricEngine(p.fabric);
      return {
        ...p,
        category: detectCategory(p.name, p.fabric),
        analysis,
        score: analysis.score,
        costPerf: calculateCostPerformance(analysis.score, p.price)
      };
    });
  }

  // localStorage에서 저장된 분석 라벨 복원
  try {
    restoreSavedLabelsToProducts();
    renderSavedLabelsUI();
  } catch (e) {
    console.warn("[옷라벨] 저장된 라벨 복원 예외 처리:", e);
  }

  renderProductCards();

  // 딥링크 처리 (?compare=1,3)
  handleDeepLinkOnLoad();
}

// =============================================================
// 10. 상품 카드 렌더링 (브랜드 & 카테고리 필터 지원)
// =============================================================
function renderProductCards() {
  const container = document.getElementById("product-container");
  if (!container) return;
  container.innerHTML = "";

  // PC 그리드 레이아웃 적응 동기화
  setupResponsivePCView();

  const searchInput = document.getElementById("search-input");
  const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
  
  let filtered = products.filter(p => {
    // 브랜드 필터
    const matchBrand = selectedBrand === "ALL" || (p.brand && p.brand.toLowerCase() === selectedBrand.toLowerCase());
    
    // 카테고리 필터
    const matchCategory = selectedCategory === "ALL" || (p.category && p.category === selectedCategory);

    // 검색어 필터
    const matchSearch = (p.name && p.name.toLowerCase().includes(term)) || 
                        (p.fabric && p.fabric.toLowerCase().includes(term)) ||
                        (p.brand && p.brand.toLowerCase().includes(term));

    return matchBrand && matchCategory && matchSearch;
  });

  // 정렬(Sort) 적용
  filtered.sort((a, b) => {
    if (selectedSort === "costPerf") return (b.costPerf || 0) - (a.costPerf || 0);
    if (selectedSort === "score") return (b.score || 0) - (a.score || 0);
    if (selectedSort === "priceAsc") return (a.price || 0) - (b.price || 0);
    // 추천순: 스폰서 상품 우선, 그 외 id 순
    if (a.isSponsored && !b.isSponsored) return -1;
    if (!a.isSponsored && b.isSponsored) return 1;
    return (a.id || 0) - (b.id || 0);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 space-y-2.5 my-2">
        <div class="w-12 h-12 mx-auto rounded-full bg-gray-50 flex items-center justify-center text-gray-400 text-xl border border-gray-100">
          <i class="fa-solid fa-shirt"></i>
        </div>
        <p class="text-xs font-bold text-gray-700">해당 조건에 일치하는 상품이 없습니다.</p>
        <p class="text-[11px] text-gray-500 leading-relaxed">
          선택한 필터(브랜드: <span class="font-semibold text-indigo-600">${selectedBrand}</span>, 
          카테고리: <span class="font-semibold text-indigo-600">${selectedCategory}</span>)를 변경하거나<br>
          상단 실시간 케어라벨 분석기로 직접 혼용률을 입력해 보세요!
        </p>
        <button onclick="resetFilters()" class="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
          필터 초기화
        </button>
      </div>
    `;
    return;
  }

  filtered.forEach(p => {
    // QA 방어: analysis 및 지표 객체 무결성 보장
    if (!p.analysis) {
      p.analysis = analyzeFabricEngine(p.fabric || "");
      p.score = p.analysis.score;
      p.costPerf = calculateCostPerformance(p.score, p.price || 0);
    }

    const isSelected = compareList.some(item => item.id === p.id);
    const card = document.createElement("div");

    const sponsorClass = p.isSponsored ? 'sponsor-glow border-amber-300' : '';
    card.className = `product-editorial-card p-3 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between ${
      isSelected 
        ? 'ring-2 ring-emerald-600 bg-emerald-50/20 border-emerald-500 shadow-md' 
        : `bg-white border-gray-200/90 hover:border-gray-300 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 ${sponsorClass}`
    }`;

    let barColor = "bg-emerald-600";
    let scoreColor = "text-emerald-700";
    let badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
    const scoreVal = typeof p.score === "number" ? p.score : (p.analysis?.score || 0);
    if (scoreVal >= 88) {
      barColor = "bg-emerald-500"; scoreColor = "text-emerald-700"; badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
    } else if (scoreVal >= 75) {
      barColor = "bg-teal-600"; scoreColor = "text-teal-700"; badgeBg = "bg-teal-50 text-teal-800 border-teal-200";
    } else if (scoreVal >= 60) {
      barColor = "bg-amber-500"; scoreColor = "text-amber-700"; badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
    } else {
      barColor = "bg-slate-400"; scoreColor = "text-slate-600"; badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
    }

    // 천연섬유/합성섬유 분류 정밀 판별 및 배지 생성
    const NATURAL_FIBER_REGEX = /면|코튼|cotton|울|모|양모|메리노|merino|lambswool|wool|캐시미어|cashmere|알파카|alpaca|야크|yak|모헤어|mohair|린넨|리넨|linen|마|마혼방|견|실크|silk|다운|down|솜털|깃털|구스|덕/i;
    const componentChips = (p.analysis && Array.isArray(p.analysis.components) && p.analysis.components.length > 0)
      ? p.analysis.components.slice(0, 3).map(c => {
          const isNat = NATURAL_FIBER_REGEX.test(c.name) || NATURAL_FIBER_REGEX.test(c.rawName || "");
          const badgeCls = isNat ? "badge-natural" : "badge-synthetic";
          const icon = isNat ? '<i class="fa-solid fa-leaf text-[8px] text-emerald-600 mr-0.5"></i>' : '';
          return `<span class="badge-ratio ${badgeCls} text-[10px] px-2 py-0.5 rounded-md shadow-2xs tabular-nums">${icon}${escapeHTML(c.name)} ${c.percent}%</span>`;
        }).join("")
      : `<span class="badge-ratio badge-synthetic text-[10px] px-2 py-0.5 rounded-md">${escapeHTML(p.analysis?.keySummary || "라벨 확인 필요")}</span>`;

    // 스폰서/제휴 뱃지 HTML (공정거래위원회 심사지침 준수)
    const sponsorBadge = p.isSponsored
      ? `<span class="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs" title="구매 시 수수료를 지급받을 수 있는 광고·제휴 링크입니다."><i class="fa-solid fa-rectangle-ad text-[9px] text-amber-700"></i>광고·제휴 링크 — 구매 시 수수료를 지급받을 수 있습니다</span>`
      : '';

    // 카테고리 태그
    const categoryBadge = p.category ? `<span class="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">${escapeHTML(p.category)}</span>` : '';

    const safeBrand = escapeHTML(p.brand || "기타");
    const safeName = escapeHTML(p.name || "의류");
    const safeFabric = escapeHTML(p.fabric || "상세 라벨 확인 필요");
    const jsBrand = escapeJS(p.brand || "");
    const jsName = escapeJS(p.name || "");
    const jsLink = escapeJS(p.link || "#");

    // 고품질 저작권 안전 스튜디오 비주얼 요소 생성
    const visualSVG = getCategoryVisualSVG(p.category, p.brand, p.fabric, p.analysis, { size: "card", name: p.name });
    const brandStyle = getBrandStyle(p.brand);
    const fiberSummary = getFabricSummary(p.analysis);
    const fiberMiniBar = getFabricMiniProgressBar(p.analysis);

    card.innerHTML = `
      ${sponsorBadge ? `<div class="mb-2 flex items-center justify-between">${sponsorBadge} <span class="text-[9px] text-amber-800 font-medium">공정위 지침 준수</span></div>` : ''}
      
      <!-- 상단: 감각적인 의류 썸네일 룩북 프레임 (Otlabel Lookbook Spec) -->
      <div class="product-visual-wrapper relative w-full rounded-xl overflow-hidden mb-2.5 bg-gradient-to-br ${brandStyle.bgGradient} border border-gray-150 shadow-2xs group">
        <!-- 상단: 브랜드 시그니처 배지 & 케어라벨 스펙 태그 -->
        <div class="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide text-white shadow-2xs" style="background-color: ${brandStyle.primary}">
            <span class="w-1.5 h-1.5 rounded-full border border-white/40" style="background-color: ${brandStyle.accent}"></span>
            <span>${safeBrand}</span>
          </span>
          <span class="text-[9px] font-bold text-gray-600 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full border border-gray-200/80 shadow-2xs">
            CARE LABEL · SPEC
          </span>
        </div>

        <!-- 스튜디오 실루엣 SVG 일러스트 (모바일 세로 높이 슬림 최적화) -->
        <div class="w-full h-28 sm:h-32 flex items-center justify-center pt-4 pb-1 px-3 transition-transform duration-300 group-hover:scale-[1.03]">
          ${visualSVG}
        </div>

        <!-- 하단: 원단 주요 구성 미니 프로그레스 바 -->
        <div class="px-2.5 py-1 bg-white/95 backdrop-blur-xs border-t border-gray-100/90">
          <div class="flex items-center justify-between text-[9px] font-bold text-gray-600 mb-0.5">
            <span class="flex items-center gap-1">
              <i class="fa-solid fa-layer-group text-[8px] text-emerald-600"></i>
              <span>원단 주요 구성</span>
            </span>
            <span class="text-gray-700 font-extrabold text-[9px] truncate max-w-[130px]">${fiberSummary}</span>
          </div>
          <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner border border-gray-200/50">
            ${fiberMiniBar}
          </div>
        </div>
      </div>

      <!-- 브랜드, 카테고리, 가성비, 상품명, 가격 -->
      <div>
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1 mb-1 flex-wrap">
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeBg}">${safeBrand}</span>
              ${categoryBadge}
              <span class="text-[9px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded tabular-nums">가성비 ${p.costPerf || 0} pt</span>
              ${p.analysis?.grade ? `<span class="text-[9px] text-gray-500 font-medium">${escapeHTML(p.analysis.grade)}</span>` : ''}
            </div>
            <h3 class="text-xs sm:text-sm font-extrabold text-[#111827] leading-snug line-clamp-2 break-keep">${safeName}</h3>
          </div>
          <div class="text-right whitespace-nowrap pl-1">
            <span class="text-xs sm:text-sm font-black text-[#111827] tabular-nums">${(p.price || 0) > 0 ? p.price.toLocaleString() + '원' : '가격 미정'}</span>
          </div>
        </div>

        <!-- 실제 의류 안쪽 세탁 라벨(Care Label) 질감 박스 & 소재 점수 설명 툴팁 -->
        <div class="my-2 care-label-box p-2.5 sm:p-3 rounded-xl border border-dashed border-gray-200 space-y-2 bg-[#FAFAF9]">
          <div class="flex justify-between items-center text-xs">
            <div class="flex items-center gap-1.5 relative">
              <span class="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                <i class="fa-solid fa-gauge-high text-emerald-600 text-[10px]"></i>
                <span>소재 환산 지표</span>
              </span>
              <div class="relative inline-block">
                <button type="button" 
                        onclick="event.stopPropagation(); window.toggleScoreTooltip(this, event);" 
                        class="score-tooltip-btn w-3.5 h-3.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 text-[9px] font-black flex items-center justify-center transition-colors cursor-pointer border border-gray-300"
                        title="소재 환산 점수 안내">
                  ?
                </button>
                <!-- Tooltip Popover (PC hover & mobile click) -->
                <div class="score-tooltip-popover hidden absolute left-0 bottom-full mb-1.5 w-60 p-2.5 bg-gray-900 text-white rounded-xl shadow-xl text-[10px] leading-relaxed z-40 select-none">
                  <div class="font-bold text-emerald-400 mb-0.5 flex items-center gap-1">
                    <i class="fa-solid fa-circle-info text-[9px]"></i>
                    <span>소재 환산 점수란?</span>
                  </div>
                  <p class="text-gray-300">공식몰 케어라벨 혼용률(%)을 바탕으로 천연·기능성 원단 비중을 100점 만점으로 환산한 참고 지표입니다.</p>
                  <p class="text-[9px] text-gray-400 mt-1 border-t border-gray-700 pt-1">실제 직조감 및 상세 스펙은 브랜드 공식몰에서 확인해 주세요.</p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[9px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200/80 font-medium">공식 표기 기준 · 확인일: ${escapeHTML(p.checkedDate || '2026-11-21')}</span>
              <span class="text-xs sm:text-sm font-black tabular-nums ${scoreColor}">${scoreVal}<span class="text-[10px] text-gray-400 font-normal">/100점</span></span>
            </div>
          </div>
          <div class="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden shadow-inner">
            <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${scoreVal}%"></div>
          </div>
          <div class="pt-0.5 space-y-1">
            <div class="flex flex-wrap gap-1">${componentChips}</div>
            <p class="text-[10px] text-gray-500 leading-snug break-words break-keep line-clamp-2">
              <span class="font-bold text-gray-600">공식 표기 케어라벨:</span> ${safeFabric}
            </p>
          </div>
        </div>
      </div>

      <!-- 하단 버튼: [브랜드 공식몰에서 확인하기 ↗] + [맞대결 담기] -->
      <div class="flex items-center gap-2 pt-1.5 mt-auto">
        <button onclick="handleOutboundClick('${jsBrand}','${jsName}','${jsLink}')"
           class="flex-1 py-2 px-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1 active:scale-95 text-center cursor-pointer min-w-0" title="해당 브랜드 공식 온라인몰 또는 판매처로 이동합니다.">
          <span class="truncate">브랜드 공식몰에서 확인하기</span>
          <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-gray-400 shrink-0"></i>
        </button>

        <button onclick="toggleCompare(${p.id})" 
                class="py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap active:scale-95 shadow-xs cursor-pointer shrink-0 ${
                  isSelected 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-[#111827] text-white hover:bg-black'
                }">
          <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-plus'} text-[10px]"></i>
          <span>${isSelected ? '선택 취소' : '맞대결 담기'}</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

window.resetFilters = function() {
  selectedBrand = "ALL";
  selectedCategory = "ALL";
  selectedSort = "recommended";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  document.querySelectorAll(".brand-btn").forEach(b => {
    b.className = (b.dataset?.brand === "ALL")
      ? "brand-btn active whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-[#111827] text-white transition-all shadow-xs"
      : "brand-btn whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all";
  });

  document.querySelectorAll(".category-btn").forEach(b => {
    b.className = (b.dataset?.category === "ALL")
      ? "category-btn active whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-900 text-white transition-all"
      : "category-btn whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all";
  });

  document.querySelectorAll(".sort-btn").forEach(b => {
    b.className = (b.dataset?.sort === "recommended")
      ? "sort-btn active flex-1 py-1.5 rounded-lg font-bold text-center bg-white text-indigo-700 shadow-sm transition-all"
      : "sort-btn flex-1 py-1.5 rounded-lg font-medium text-center text-gray-600 hover:text-gray-900 transition-all";
  });

  renderProductCards();
};

// =============================================================
// 11. 맞대결 토글 & UI 동기화
// =============================================================
window.toggleCompare = function(id) {
  const item = products.find(p => p.id === id);
  if (!item) return;

  const index = compareList.findIndex(p => p.id === id);

  if (index > -1) {
    compareList.splice(index, 1);
    showToast("비교함에서 제거되었습니다.");
  } else {
    if (compareList.length >= 2) {
      showToast("맞대결은 최대 2개 상품까지만 가능합니다!");
      return;
    }
    compareList.push(item);
    showToast(`'${item.brand}' 상품이 맞대결에 담겼습니다.`);
  }

  updateCompareUI();
  renderProductCards();
};

function updateCompareUI() {
  const badge = document.getElementById("compare-badge");
  const bottomCount = document.getElementById("bottom-bar-count");
  if (badge) badge.innerText = compareList.length;
  if (bottomCount) bottomCount.innerText = compareList.length;

  // 모바일 하단 비교 트레이 업데이트 (브랜드 칩 & 선택 상태)
  const bottomBar = document.getElementById("compare-bottom-bar");
  const previewBox = document.getElementById("bottom-bar-items-preview");
  if (bottomBar) {
    if (compareList.length > 0) {
      bottomBar.classList.remove("hidden");
    } else {
      bottomBar.classList.add("hidden");
    }
  }

  if (previewBox) {
    if (compareList.length === 0) {
      previewBox.innerHTML = `<span>맞대결 상품 선택 중</span>`;
    } else if (compareList.length === 1) {
      previewBox.innerHTML = `
        <span class="bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded text-[11px] font-bold truncate max-w-[100px] border border-indigo-700/50">${escapeHTML(compareList[0].brand)}</span>
        <span class="text-[10px] text-gray-400 font-medium truncate">1개 선택됨 (+1개 필요)</span>
      `;
    } else {
      previewBox.innerHTML = `
        <span class="bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded text-[11px] font-bold truncate max-w-[76px] border border-indigo-700/50">${escapeHTML(compareList[0].brand)}</span>
        <span class="text-[10px] font-extrabold text-indigo-400 shrink-0">vs</span>
        <span class="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold truncate max-w-[76px] border border-emerald-700/50">${escapeHTML(compareList[1].brand)}</span>
      `;
    }
  }

  const shareBtn = document.getElementById("modal-share-btn");
  if (shareBtn) {
    if (compareList.length === 2) {
      shareBtn.classList.remove("hidden");
    } else {
      shareBtn.classList.add("hidden");
    }
  }

  // PC 우측 1:1 실시간 스펙 비교 대시보드 (Split-View) 실시간 동기화
  updateDesktopCompareDashboard();
}

// PC 1:1 실시간 스펙 대조 대시보드 렌더러
function updateDesktopCompareDashboard() {
  const desktopBox = document.getElementById("desktop-compare-content");
  if (!desktopBox) return;
  desktopBox.innerHTML = generateCompareHTML();
}

// =============================================================
// 12. 1:1 맞대결 스펙 HTML 생성 엔진 (모바일 바텀시트 & PC Split-View 공용)
// =============================================================
function generateCompareHTML() {
  if (compareList.length === 0) {
    return `
      <div class="text-center py-10 px-4 space-y-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xs">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-xs">
          <i class="fa-solid fa-scale-unbalanced"></i>
        </div>
        <div>
          <h4 class="text-xs font-bold text-gray-800">1:1 실시간 맞대결 대기 중</h4>
          <p class="text-[11px] text-gray-500 mt-1 leading-relaxed">
            상품 카드의 <strong>[맞대결 담기]</strong> 버튼을 눌러<br>
            두 상품의 혼용률과 가격차를 즉시 대조해 보세요!
          </p>
        </div>
        <div class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-full border border-indigo-100">
          <i class="fa-solid fa-lightbulb text-amber-500"></i>
          <span>동일 카테고리(예: 티셔츠 vs 티셔츠) 대조 권장</span>
        </div>
      </div>
    `;
  } else if (compareList.length === 1) {
    const item = compareList[0];
    if (!item.analysis) {
      item.analysis = analyzeFabricEngine(item.fabric || "");
      item.score = item.analysis.score;
      item.costPerf = calculateCostPerformance(item.score, item.price || 0);
    }
    const safeBrand = escapeHTML(item.brand || "기타");
    const safeName = escapeHTML(item.name || "의류");
    const safeFabric = escapeHTML(item.fabric || "상세 라벨 확인 권장");
    const jsBrand = escapeJS(item.brand || "");
    const jsName = escapeJS(item.name || "");
    const jsLink = escapeJS(item.link || "#");

    const itemBrandStyle = getBrandStyle(item.brand);
    const itemVisualSVG = getCategoryVisualSVG(item.category, item.brand, item.fabric, item.analysis, { size: "modal", name: item.name });
    const itemFiberSummary = getFabricSummary(item.analysis);
    const itemMiniBar = getFabricMiniProgressBar(item.analysis);

    return `
      <div class="bg-gray-100/90 border border-gray-200 rounded-xl p-3 text-gray-800 text-xs flex items-center gap-2">
        <i class="fa-solid fa-circle-question text-emerald-600 text-sm shrink-0"></i>
        <span>상대할 <strong>두 번째 상품</strong>을 목록에서 추가로 선택해주세요!</span>
      </div>

      <div class="border border-gray-200 rounded-2xl p-3 sm:p-4 bg-white shadow-2xs space-y-3 mt-3">
        <!-- 1개 선택 시 스튜디오 비주얼 쇼케이스 썸네일 -->
        <div class="relative w-full rounded-xl overflow-hidden mb-2 bg-gradient-to-br ${itemBrandStyle.bgGradient} border border-gray-100 shadow-2xs group">
          <div class="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-xs" style="background-color: ${itemBrandStyle.primary}">
              <span class="w-1.5 h-1.5 rounded-full border border-white/40" style="background-color: ${itemBrandStyle.accent}"></span>
              <span>${safeBrand}</span>
            </span>
            <span class="text-[9px] font-bold text-gray-500 bg-white/95 px-2 py-0.5 rounded-full border border-gray-200/70 shadow-2xs">CARE LABEL · SPEC</span>
          </div>
          <div class="w-full h-32 sm:h-36 flex items-center justify-center pt-5 pb-1 px-3">
            ${itemVisualSVG}
          </div>
          <div class="px-2.5 py-1.5 bg-white/95 border-t border-gray-100">
            <div class="flex justify-between items-center text-[10px] font-bold text-gray-600 mb-0.5">
              <span>원단 주요 구성</span>
              <span class="text-gray-700 font-extrabold text-[10px] truncate max-w-[140px]">${itemFiberSummary}</span>
            </div>
            <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
              ${itemMiniBar}
            </div>
          </div>
        </div>

        <div class="flex justify-between items-start gap-2">
          <span class="text-[10px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 truncate max-w-[120px]">${safeBrand}</span>
          <span class="text-xs font-black text-gray-900 whitespace-nowrap tabular-nums">${(item.price || 0) > 0 ? item.price.toLocaleString() + '원' : '가격 미정'}</span>
        </div>
        <h4 class="text-xs font-bold text-gray-900 break-keep">${safeName}</h4>
        
        <div class="care-label-box p-2.5 rounded-xl border border-dashed border-gray-200 space-y-1.5 bg-[#FAFAF9]">
          <div class="flex justify-between text-[11px]">
            <span class="text-gray-600 font-semibold">소재 퀄리티 점수</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[9px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 font-medium">공식 표기 기준 · 확인일: ${escapeHTML(item.checkedDate || '2026-11-21')}</span>
              <span class="font-black text-emerald-700 tabular-nums">${item.score || 0}점</span>
            </div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-emerald-600 h-2 rounded-full" style="width: ${item.score || 0}%"></div>
          </div>
          <p class="text-[11px] text-gray-700 pt-1 font-medium break-words break-keep">${safeFabric}</p>
        </div>

        <button onclick="handleOutboundClick('${jsBrand}','${jsName}','${jsLink}')"
           class="w-full py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs">
          <span class="truncate">브랜드 공식몰에서 확인하기</span>
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-gray-500 shrink-0"></i>
        </button>
        <p class="text-[9.5px] text-gray-400 text-center leading-tight mt-2">
          * 본 이미지 및 도식은 케어라벨 소재 정보 이해를 돕기 위한 Otlabel 자체 제작 참고 그래픽이며, 실제 디자인·색상은 공식 온라인몰 상세페이지를 확인해 주세요.
        </p>
      </div>
    `;
  } else {
    const [a, b] = compareList;
    if (!a.analysis) {
      a.analysis = analyzeFabricEngine(a.fabric || "");
      a.score = a.analysis.score;
      a.costPerf = calculateCostPerformance(a.score, a.price || 0);
    }
    if (!b.analysis) {
      b.analysis = analyzeFabricEngine(b.fabric || "");
      b.score = b.analysis.score;
      b.costPerf = calculateCostPerformance(b.score, b.price || 0);
    }

    const priceDiff = Math.abs((a.price || 0) - (b.price || 0));
    const scoreDiff = Math.abs((a.score || 0) - (b.score || 0));
    const cheaper = (a.price || 0) < (b.price || 0) ? a : ((a.price || 0) > (b.price || 0) ? b : null);
    const betterFabric = (a.score || 0) > (b.score || 0) ? a : ((a.score || 0) < (b.score || 0) ? b : null);
    const betterCostPerf = (a.costPerf || 0) > (b.costPerf || 0) ? a : ((a.costPerf || 0) < (b.costPerf || 0) ? b : null);

    const aNat = a.analysis?.naturalPercent || 0;
    const bNat = b.analysis?.naturalPercent || 0;
    const natDiff = Math.abs(Math.round((aNat - bNat) * 10) / 10);
    const aNatBadge = aNat > bNat
      ? `<span class="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0 tabular-nums">천연섬유 분류 비중 ${natDiff}%p 높음</span>`
      : (aNat === bNat ? `<span class="text-[9px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full shrink-0">천연섬유 분류 비중 동일</span>` : '');
    const bNatBadge = bNat > aNat
      ? `<span class="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0 tabular-nums">천연섬유 분류 비중 ${natDiff}%p 높음</span>`
      : (aNat === bNat ? `<span class="text-[9px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full shrink-0">천연섬유 분류 비중 동일</span>` : '');

    const NATURAL_FIBER_REGEX = /면|코튼|cotton|울|모|양모|메리노|merino|lambswool|wool|캐시미어|cashmere|알파카|alpaca|야크|yak|모헤어|mohair|린넨|리넨|linen|마|마혼방|견|실크|silk|다운|down|솜털|깃털|구스|덕/i;
    const aBadges = (a.analysis?.components?.length > 0)
      ? a.analysis.components.slice(0, 3).map(c => {
          const isNat = NATURAL_FIBER_REGEX.test(c.name) || NATURAL_FIBER_REGEX.test(c.rawName || "");
          const cls = isNat ? "badge-natural" : "badge-synthetic";
          return `<span class="badge-ratio ${cls} text-[10px] px-1.5 py-0.5 rounded shadow-2xs tabular-nums">${escapeHTML(c.name)} ${c.percent}%</span>`;
        }).join(" ")
      : `<span class="text-[10px] text-gray-500">${escapeHTML(a.analysis?.keySummary || "라벨 확인 권장")}</span>`;

    const bBadges = (b.analysis?.components?.length > 0)
      ? b.analysis.components.slice(0, 3).map(c => {
          const isNat = NATURAL_FIBER_REGEX.test(c.name) || NATURAL_FIBER_REGEX.test(c.rawName || "");
          const cls = isNat ? "badge-natural" : "badge-synthetic";
          return `<span class="badge-ratio ${cls} text-[10px] px-1.5 py-0.5 rounded shadow-2xs tabular-nums">${escapeHTML(c.name)} ${c.percent}%</span>`;
        }).join(" ")
      : `<span class="text-[10px] text-gray-500">${escapeHTML(b.analysis?.keySummary || "라벨 확인 권장")}</span>`;

    const aSafeBrand = escapeHTML(a.brand || "기타");
    const aSafeName = escapeHTML(a.name || "의류");
    const aSafeFabric = escapeHTML(a.fabric || "상세 라벨 확인 권장");
    const aJsBrand = escapeJS(a.brand || "");
    const aJsName = escapeJS(a.name || "");
    const aJsLink = escapeJS(a.link || "#");

    const bSafeBrand = escapeHTML(b.brand || "기타");
    const bSafeName = escapeHTML(b.name || "의류");
    const bSafeFabric = escapeHTML(b.fabric || "상세 라벨 확인 권장");
    const bJsBrand = escapeJS(b.brand || "");
    const bJsName = escapeJS(b.name || "");
    const bJsLink = escapeJS(b.link || "#");

    const aBrandStyle = getBrandStyle(a.brand);
    const bBrandStyle = getBrandStyle(b.brand);
    const aVisualSVG = getCategoryVisualSVG(a.category, a.brand, a.fabric, a.analysis, { size: "modal", name: a.name });
    const bVisualSVG = getCategoryVisualSVG(b.category, b.brand, b.fabric, b.analysis, { size: "modal", name: b.name });
    const aFiberSummary = getFabricSummary(a.analysis);
    const bFiberSummary = getFabricSummary(b.analysis);
    const aMiniBar = getFabricMiniProgressBar(a.analysis);
    const bMiniBar = getFabricMiniProgressBar(b.analysis);

    // 가격 차이 안내 문구 (공식 표시 정가 기준 객관적 표기)
    let priceComparisonBadge = "";
    if (a.price === b.price) {
      priceComparisonBadge = `<span class="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">공식 표시 정가 동일</span>`;
    } else if (cheaper) {
      priceComparisonBadge = `<span class="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full inline-block leading-snug tabular-nums">
        ${escapeHTML(cheaper.brand)} 공식 표시 정가 ${priceDiff.toLocaleString()}원 낮음
      </span>`;
    }

    return `
      <!-- 가격 차이 하이라이트 배너 -->
      <div class="p-2.5 rounded-xl bg-white border border-gray-200/90 shadow-2xs flex items-center justify-between gap-1">
        <div class="text-[11px] font-bold text-gray-800 flex items-center gap-1.5 shrink-0">
          <i class="fa-solid fa-coins text-amber-500"></i>
          <span>공식 표시 정가 비교:</span>
        </div>
        <div class="text-right min-w-0 tabular-nums">${priceComparisonBadge}</div>
      </div>

      <!-- 1:1 대결 상단 카드 (2열 - 모바일 360px 및 PC Split-View 대응) -->
      <div class="grid grid-cols-2 gap-2 sm:gap-3 text-center">
        <!-- A 상품 -->
        <div class="bg-white p-2.5 sm:p-3 rounded-2xl border flex flex-col justify-between min-w-0 ${betterFabric?.id === a.id ? 'border-emerald-600 ring-2 ring-emerald-100 shadow-sm' : 'border-gray-200'}">
          <!-- A Visual Studio Artwork Showcase -->
          <div class="relative w-full rounded-xl overflow-hidden mb-2 bg-gradient-to-br ${aBrandStyle.bgGradient} border border-gray-100 shadow-2xs">
            <div class="absolute top-1.5 left-1.5 flex items-center gap-1 z-10 pointer-events-none">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white shadow-2xs" style="background-color: ${aBrandStyle.primary}">
                <span class="w-1 h-1 rounded-full border border-white/40" style="background-color: ${aBrandStyle.accent}"></span>
                <span class="truncate max-w-[65px] sm:max-w-[90px]">${aSafeBrand}</span>
              </span>
            </div>
            <div class="w-full h-28 sm:h-32 flex items-center justify-center pt-4 pb-1 px-1">
              ${aVisualSVG}
            </div>
            <div class="px-2 py-1 bg-white/95 border-t border-gray-100">
              <div class="flex justify-between items-center text-[9px] font-bold text-gray-500 mb-0.5">
                <span>혼용 구성</span>
                <span class="text-gray-700 font-extrabold truncate max-w-[80px] sm:max-w-[100px]">${aFiberSummary}</span>
              </div>
              <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                ${aMiniBar}
              </div>
            </div>
          </div>

          <div class="min-w-0">
            <div class="flex items-center justify-between gap-1 mb-1 flex-wrap">
              <span class="text-[10px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 truncate max-w-[76px] sm:max-w-[100px]">${aSafeBrand}</span>
              ${aNatBadge}
            </div>
            <h4 class="text-xs font-bold text-gray-900 mt-1 line-clamp-2 text-left leading-tight break-words break-keep">${aSafeName}</h4>
            <p class="text-xs sm:text-sm font-black text-gray-900 mt-1 text-left whitespace-nowrap tabular-nums">${(a.price || 0) > 0 ? a.price.toLocaleString() + '원' : '가격 미정'}</p>
            ${cheaper?.id === a.id && priceDiff > 0 ? `<p class="text-[10px] font-bold text-emerald-700 text-left truncate tabular-nums">(공식 표시 정가 ${priceDiff.toLocaleString()}원 낮음)</p>` : ''}
            <div class="text-[9px] text-gray-500 font-medium text-left mt-0.5 truncate">공식 표기 기준 · 확인일: ${escapeHTML(a.checkedDate || '2026-11-21')}</div>
          </div>
          <button onclick="handleOutboundClick('${aJsBrand}','${aJsName}','${aJsLink}')"
             class="mt-2.5 w-full py-1.5 px-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer min-w-0 shadow-2xs">
            <span class="truncate">브랜드 공식몰에서 확인하기</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-gray-400 shrink-0"></i>
          </button>
        </div>
        
        <!-- B 상품 -->
        <div class="bg-white p-2.5 sm:p-3 rounded-2xl border flex flex-col justify-between min-w-0 ${betterFabric?.id === b.id ? 'border-emerald-600 ring-2 ring-emerald-100 shadow-sm' : 'border-gray-200'}">
          <!-- B Visual Studio Artwork Showcase -->
          <div class="relative w-full rounded-xl overflow-hidden mb-2 bg-gradient-to-br ${bBrandStyle.bgGradient} border border-gray-100 shadow-2xs">
            <div class="absolute top-1.5 left-1.5 flex items-center gap-1 z-10 pointer-events-none">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white shadow-2xs" style="background-color: ${bBrandStyle.primary}">
                <span class="w-1 h-1 rounded-full border border-white/40" style="background-color: ${bBrandStyle.accent}"></span>
                <span class="truncate max-w-[65px] sm:max-w-[90px]">${bSafeBrand}</span>
              </span>
            </div>
            <div class="w-full h-28 sm:h-32 flex items-center justify-center pt-4 pb-1 px-1">
              ${bVisualSVG}
            </div>
            <div class="px-2 py-1 bg-white/95 border-t border-gray-100">
              <div class="flex justify-between items-center text-[9px] font-bold text-gray-500 mb-0.5">
                <span>혼용 구성</span>
                <span class="text-gray-700 font-extrabold truncate max-w-[80px] sm:max-w-[100px]">${bFiberSummary}</span>
              </div>
              <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                ${bMiniBar}
              </div>
            </div>
          </div>

          <div class="min-w-0">
            <div class="flex items-center justify-between gap-1 mb-1 flex-wrap">
              <span class="text-[10px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 truncate max-w-[76px] sm:max-w-[100px]">${bSafeBrand}</span>
              ${bNatBadge}
            </div>
            <h4 class="text-xs font-bold text-gray-900 mt-1 line-clamp-2 text-left leading-tight break-words break-keep">${bSafeName}</h4>
            <p class="text-xs sm:text-sm font-black text-gray-900 mt-1 text-left whitespace-nowrap tabular-nums">${(b.price || 0) > 0 ? b.price.toLocaleString() + '원' : '가격 미정'}</p>
            ${cheaper?.id === b.id && priceDiff > 0 ? `<p class="text-[10px] font-bold text-emerald-700 text-left truncate tabular-nums">(공식 표시 정가 ${priceDiff.toLocaleString()}원 낮음)</p>` : ''}
            <div class="text-[9px] text-gray-500 font-medium text-left mt-0.5 truncate">공식 표기 기준 · 확인일: ${escapeHTML(b.checkedDate || '2026-11-21')}</div>
          </div>
          <button onclick="handleOutboundClick('${bJsBrand}','${bJsName}','${bJsLink}')"
             class="mt-2.5 w-full py-1.5 px-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer min-w-0 shadow-2xs">
            <span class="truncate">브랜드 공식몰에서 확인하기</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-gray-400 shrink-0"></i>
          </button>
        </div>
      </div>

      <!-- 비주얼 그래픽 법적 참고 고지 -->
      <p class="text-[9.5px] text-gray-400 text-center leading-tight -mt-1 mb-1">
        * 본 이미지 및 도식은 케어라벨 소재 정보 이해를 돕기 위한 Otlabel 자체 제작 참고 그래픽이며, 실제 디자인·색상은 공식 온라인몰 상세페이지를 확인해 주세요.
      </p>

      <!-- 정밀 비교 바 및 수치 대조 -->
      <div class="bg-white rounded-2xl p-3 sm:p-3.5 space-y-3.5 border border-gray-200 shadow-2xs">
        <!-- 표시 소재 혼용률 비교 게이지 -->
        <div>
          <div class="flex justify-between items-center text-[11px] font-bold text-gray-700 mb-1.5 gap-1">
            <span class="truncate max-w-[90px] sm:max-w-[120px] tabular-nums ${betterFabric?.id === a.id ? 'text-emerald-700 font-black' : ''}">${aSafeBrand} (${a.score || 0}점)</span>
            <span class="text-[10px] text-gray-500 font-semibold shrink-0">표시 소재 혼용률 비교 (공식 표기 기준)</span>
            <span class="truncate max-w-[90px] sm:max-w-[120px] text-right tabular-nums ${betterFabric?.id === b.id ? 'text-emerald-700 font-black' : ''}">(${b.score || 0}점) ${bSafeBrand}</span>
          </div>
          <div class="grid grid-cols-2 gap-1 h-3">
            <div class="bg-gray-200 rounded-l-full overflow-hidden flex justify-end">
              <div class="bg-emerald-600 h-full rounded-l-full transition-all duration-500" style="width: ${a.score || 0}%"></div>
            </div>
            <div class="bg-gray-200 rounded-r-full overflow-hidden flex justify-start">
              <div class="bg-emerald-600 h-full rounded-r-full transition-all duration-500" style="width: ${b.score || 0}%"></div>
            </div>
          </div>
        </div>

        <!-- 핵심 혼용률 수치 강조 배지 -->
        <div class="pt-2 border-t border-gray-200/80">
          <div class="text-[10px] font-bold text-gray-500 text-center mb-1.5">핵심 섬유 비율 (Top 3)</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-[#FAFAF9] p-2 rounded-xl border border-gray-200 flex flex-wrap gap-1 justify-center min-w-0">${aBadges}</div>
            <div class="bg-[#FAFAF9] p-2 rounded-xl border border-gray-200 flex flex-wrap gap-1 justify-center min-w-0">${bBadges}</div>
          </div>
        </div>

        <!-- 케어라벨 원문 대조 -->
        <div class="pt-2 border-t border-gray-200/80">
          <div class="text-[10px] font-bold text-gray-500 text-center mb-1.5">케어라벨 공식 표기 원문</div>
          <div class="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
            <div class="bg-[#FAFAF9] p-2 sm:p-2.5 rounded-xl border border-gray-200 text-gray-800 font-medium break-words break-keep leading-tight overflow-hidden">${aSafeFabric}</div>
            <div class="bg-[#FAFAF9] p-2 sm:p-2.5 rounded-xl border border-gray-200 text-gray-800 font-medium break-words break-keep leading-tight overflow-hidden">${bSafeFabric}</div>
          </div>
        </div>

        <!-- 가성비 지수 -->
        <div class="pt-2 border-t border-gray-200/80 flex justify-around text-center">
          <div>
            <span class="text-[10px] text-gray-400 block font-medium">가성비 환산 지수 (참고용)</span>
            <span class="text-xs font-black tabular-nums ${betterCostPerf?.id === a.id ? 'text-emerald-700' : 'text-gray-900'}">${a.costPerf || 0} pt</span>
          </div>
          <div class="w-px bg-gray-200 h-6"></div>
          <div>
            <span class="text-[10px] text-gray-400 block font-medium">가성비 환산 지수 (참고용)</span>
            <span class="text-xs font-black tabular-nums ${betterCostPerf?.id === b.id ? 'text-emerald-700' : 'text-gray-900'}">${b.costPerf || 0} pt</span>
          </div>
        </div>

        <!-- 세탁 관리 팁 -->
        <div class="pt-2 border-t border-gray-200/80">
          <div class="text-[10px] font-bold text-gray-500 text-center mb-1.5">스마트 세탁 & 관리 팁 대조</div>
          <div class="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
            <div class="bg-[#FAFAF9] p-2 rounded-xl border border-gray-200 min-w-0">
              <ul class="list-disc pl-3 space-y-0.5 break-words break-keep">
                ${a.analysis?.careTips?.slice(0, 2).map(tip => `<li>${escapeHTML(tip)}</li>`).join("") || '<li>표준 세탁 권장</li>'}
              </ul>
            </div>
            <div class="bg-[#FAFAF9] p-2 rounded-xl border border-gray-200 min-w-0">
              <ul class="list-disc pl-3 space-y-0.5 break-words break-keep">
                ${b.analysis?.careTips?.slice(0, 2).map(tip => `<li>${escapeHTML(tip)}</li>`).join("") || '<li>표준 세탁 권장</li>'}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 비교 결과 요약 (공식 온라인몰 공시 기준) -->
      <div class="bg-white border border-gray-200 rounded-2xl p-3 sm:p-3.5 text-xs text-gray-800 space-y-2.5 shadow-2xs">
        <div class="font-extrabold flex items-center justify-between text-gray-900">
          <span class="flex items-center gap-1.5">
            <i class="fa-solid fa-circle-check text-emerald-600"></i>
            <span>비교 결과 요약</span>
          </span>
          <span class="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">공식몰 공시 기준</span>
        </div>

        <!-- 천연/합성섬유 분류 기준 안내 문구 -->
        <div class="p-2.5 bg-[#FAFAF9] rounded-xl border border-gray-200 text-[10px] text-gray-600 leading-normal">
          <span class="font-bold text-gray-800"><i class="fa-solid fa-circle-info text-emerald-600 mr-1"></i>분류 기준:</span> 면·울·캐시미어·린넨·마·견(실크)은 천연섬유로, 폴리에스터·나일론·아크릴·스판덱스·레이온·모달·텐셀 등은 합성·재생섬유로 분류하여 공시된 혼용률 수치를 합산합니다.
        </div>

        <div class="text-[11px] leading-relaxed space-y-1.5 break-keep text-gray-700">
          <p>• <strong>표시 소재 혼용률 비교:</strong> ${aNat !== bNat ? `<strong>${aNat > bNat ? escapeHTML(a.brand) : escapeHTML(b.brand)}</strong>이(가) 천연섬유 분류 비중에서 <strong class="tabular-nums">${natDiff}%p 높게</strong> 산출되었습니다. (<span class="tabular-nums">${a.brand} ${aNat}% vs ${b.brand} ${bNat}%</span>)` : `두 제품의 천연섬유 분류 비중이 동일합니다. (<span class="tabular-nums">${a.brand} ${aNat}% vs ${b.brand} ${bNat}%</span>)`}</p>
          <p>• <strong>공식 표시 정가 비교:</strong> ${cheaper && priceDiff > 0 ? `공식 온라인몰 표시 정가는 <strong>${escapeHTML(cheaper.brand)}</strong>이(가) <strong class="tabular-nums">${priceDiff.toLocaleString()}원 낮습니다</strong>. <span class="text-[10px] text-gray-500">(할인 쿠폰·프로모션에 따라 실구매가는 상이할 수 있습니다.)</span>` : '두 제품의 공식 온라인몰 표시 정가가 동일합니다.'}</p>
          <p>• <strong>가성비 환산 지수:</strong> ${betterCostPerf ? `정가 대비 섬유 점수 비례 지수는 <strong>${escapeHTML(betterCostPerf.brand)}</strong>이(가) 더 높게 산출됩니다.` : '정가 대비 섬유 비례 지수가 유사합니다.'} <span class="text-[10px] text-gray-500">(원단 밀도, 편직 방식 등은 반영되지 않은 단순 혼용률/정가 기준 수치입니다.)</span></p>
        </div>
        <div class="pt-2 border-t border-gray-200 text-[10px] text-gray-500 leading-normal flex items-start gap-1">
          <i class="fa-solid fa-circle-info text-[9px] text-emerald-600 mt-0.5 shrink-0"></i>
          <span>본 비교는 각 브랜드 공식 온라인몰에 공시된 케어라벨 혼용률 및 정가 기준의 기계적 분석 결과이며, 상품의 품질 전반에 대한 우열 단정이 아닙니다. 최종 구매 전 해당 제조사/판매사의 최신 상세 정보를 확인하시기 바랍니다.</span>
        </div>
      </div>
    `;
  }
}

function openModal() {
  const modal = document.getElementById("compare-modal");
  const content = document.getElementById("modal-content");
  const shareBtn = document.getElementById("modal-share-btn");
  if (!modal || !content) return;

  // PC 모달 너비 반응형 확장 (Split-View 최적화)
  const dialogBox = modal.querySelector(".max-w-md") || modal.firstElementChild;
  if (dialogBox && !dialogBox.classList.contains("sm:max-w-xl")) {
    dialogBox.classList.add("sm:max-w-xl", "md:max-w-2xl");
  }

  if (compareList.length === 2 && shareBtn) {
    shareBtn.classList.remove("hidden");
  } else if (shareBtn) {
    shareBtn.classList.add("hidden");
  }

  content.innerHTML = generateCompareHTML();
  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("compare-modal");
  if (modal) modal.classList.add("hidden");
}

// =============================================================
// 13. 온디맨드 분석기 이벤트
// =============================================================
function setupAnalyzerEvents() {
  const toggleAnalyzerBtn = document.getElementById("toggle-analyzer-btn");
  const analyzerPanel = document.getElementById("analyzer-panel");
  const analyzerArrow = document.getElementById("analyzer-arrow");
  const runAnalyzeBtn = document.getElementById("run-analyze-btn");
  const analyzerResultBox = document.getElementById("analyzer-result-box");
  const analyzerAddCompareBtn = document.getElementById("analyzer-add-compare-btn");
  const clearSavedLabelsBtn = document.getElementById("clear-saved-labels-btn");

  if (toggleAnalyzerBtn && analyzerPanel) {
    toggleAnalyzerBtn.addEventListener("click", () => {
      const isHidden = analyzerPanel.classList.contains("hidden");
      if (isHidden) {
        analyzerPanel.classList.remove("hidden");
        if (analyzerArrow) analyzerArrow.classList.add("rotate-180");
      } else {
        analyzerPanel.classList.add("hidden");
        if (analyzerArrow) analyzerArrow.classList.remove("rotate-180");
      }
    });
  }

  if (runAnalyzeBtn) {
    runAnalyzeBtn.addEventListener("click", () => {
      const fabricText = (document.getElementById("analyzer-fabric-input")?.value || "").trim();
      const priceVal = parseInt((document.getElementById("analyzer-price-input")?.value || "").trim(), 10) || 0;
      const nameVal = (document.getElementById("analyzer-name-input")?.value || "").trim() || "직접 분석한 의류";

      if (!fabricText) {
        showToast("혼용률 텍스트를 입력하거나 붙여넣어 주세요!");
        document.getElementById("analyzer-fabric-input")?.focus();
        return;
      }

      const analysis = analyzeFabricEngine(fabricText);
      const costPerf = calculateCostPerformance(analysis.score, priceVal);

      if (analyzerResultBox) analyzerResultBox.classList.remove("hidden");
      const scoreText = document.getElementById("analyzer-score-text");
      if (scoreText) scoreText.innerText = `${analysis.score}점 (${analysis.grade})`;
      const gaugeBar = document.getElementById("analyzer-gauge-bar");
      if (gaugeBar) gaugeBar.style.width = `${analysis.score}%`;
      
      const costPerfBadge = document.getElementById("analyzer-costperf-badge");
      if (costPerfBadge) {
        if (priceVal > 0) {
          costPerfBadge.innerText = `가성비 지수 ${costPerf} pt`;
          costPerfBadge.className = "text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full";
        } else {
          costPerfBadge.innerText = "가격 미입력 (가성비 산출 생략)";
          costPerfBadge.className = "text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full";
        }
      }

      const compList = document.getElementById("analyzer-components-list");
      if (compList) {
        compList.innerHTML = "";
        if (analysis.components.length > 0) {
          analysis.components.forEach(c => {
            const chip = document.createElement("span");
            chip.className = "badge-ratio text-[10px] font-bold bg-white text-gray-800 border border-gray-300 px-2 py-0.5 rounded-md shadow-2xs";
            chip.innerText = `${c.name} ${c.percent}%`;
            compList.appendChild(chip);
          });
        } else {
          compList.innerHTML = `<span class="text-[10px] text-gray-500">정규 백분율 미포함 (키워드 가중치 기반 산출)</span>`;
        }
      }

      const tipsList = document.getElementById("analyzer-care-tips");
      if (tipsList) {
        tipsList.innerHTML = "";
        analysis.careTips.forEach(tip => {
          const li = document.createElement("li");
          li.innerText = tip;
          tipsList.appendChild(li);
        });
      }

      customProductCounter++;
      latestAnalyzedCustom = {
        id: customProductCounter,
        brand: "자체분석",
        category: detectCategory(nameVal, fabricText),
        name: nameVal,
        price: priceVal,
        fabric: fabricText,
        analysis: analysis,
        score: analysis.score,
        costPerf: costPerf,
        link: "#",
        isSponsored: false
      };

      saveLabelToStorage(latestAnalyzedCustom);
      renderSavedLabelsUI();
      showToast("소재 스펙 분석 완료 & 자동 저장됨!");
    });
  }

  if (analyzerAddCompareBtn) {
    analyzerAddCompareBtn.addEventListener("click", () => {
      if (!latestAnalyzedCustom) return;

      if (!products.some(p => p.id === latestAnalyzedCustom.id)) {
        products.unshift(latestAnalyzedCustom);
      }

      const index = compareList.findIndex(p => p.id === latestAnalyzedCustom.id);
      if (index === -1 && compareList.length >= 2) {
        showToast("맞대결은 최대 2개 상품까지만 가능합니다!");
        return;
      }

      if (index === -1) {
        compareList.push(latestAnalyzedCustom);
        showToast(`'${latestAnalyzedCustom.name}'이(가) 맞대결에 담겼습니다!`);
      } else {
        showToast("이미 맞대결 리스트에 담겨 있습니다.");
      }

      updateCompareUI();
      renderProductCards();
    });
  }

  if (clearSavedLabelsBtn) {
    clearSavedLabelsBtn.addEventListener("click", () => {
      clearAllSavedLabels();
      products = products.filter(p => !p._fromSaved);
      renderSavedLabelsUI();
      renderProductCards();
      showToast("저장된 분석 라벨이 모두 삭제되었습니다.");
    });
  }
}

// =============================================================
// 14. 이벤트 리스너 등록 & 필터 바인딩
// =============================================================
function setupEventListeners() {
  document.getElementById("open-compare-btn")?.addEventListener("click", openModal);
  document.getElementById("bottom-action-btn")?.addEventListener("click", openModal);
  document.getElementById("close-modal-x")?.addEventListener("click", closeModal);
  document.getElementById("modal-confirm-btn")?.addEventListener("click", closeModal);
  document.getElementById("modal-share-btn")?.addEventListener("click", shareCompareResult);

  document.getElementById("modal-clear-btn")?.addEventListener("click", () => {
    compareList = [];
    updateCompareUI();
    renderProductCards();
    openModal();
  });

  // PC Split-View 대시보드 비우기 버튼
  document.getElementById("desktop-clear-btn")?.addEventListener("click", () => {
    compareList = [];
    updateCompareUI();
    renderProductCards();
    showToast("맞대결 리스트를 비웠습니다.");
  });

  document.getElementById("compare-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "compare-modal") closeModal();
  });

  document.getElementById("search-input")?.addEventListener("input", renderProductCards);

  // 브랜드 필터 버튼 이벤트
  document.querySelectorAll(".brand-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".brand-btn").forEach(b => {
        b.className = "brand-btn whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all";
      });
      const target = e.currentTarget;
      if (target) {
        target.className = "brand-btn active whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-[#111827] text-white transition-all shadow-sm";
        selectedBrand = target.dataset?.brand || "ALL";
      }
      renderProductCards();
    });
  });

  // 카테고리 필터 버튼 이벤트
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".category-btn").forEach(b => {
        b.className = "category-btn whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all";
      });
      const target = e.currentTarget;
      if (target) {
        target.className = "category-btn active whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-900 text-white transition-all";
        selectedCategory = target.dataset?.category || "ALL";
      }
      renderProductCards();
    });
  });

  // 정렬(Sort) 버튼 이벤트
  document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".sort-btn").forEach(b => {
        b.className = "sort-btn flex-1 py-1.5 rounded-lg font-medium text-center text-gray-600 hover:text-gray-900 transition-all";
      });
      const target = e.currentTarget;
      if (target) {
        target.className = "sort-btn active flex-1 py-1.5 rounded-lg font-bold text-center bg-white text-indigo-700 shadow-sm transition-all";
        selectedSort = target.dataset?.sort || "recommended";
      }
      renderProductCards();
    });
  });

  // 소재 환산 점수 안내 아코디언 토글 이벤트
  const toggleScoreGuideBtn = document.getElementById("toggle-score-guide-btn");
  const scoreGuideDetail = document.getElementById("score-guide-detail");
  const scoreGuideArrow = document.getElementById("score-guide-arrow");

  if (toggleScoreGuideBtn && scoreGuideDetail) {
    toggleScoreGuideBtn.addEventListener("click", () => {
      const isHidden = scoreGuideDetail.classList.contains("hidden");
      if (isHidden) {
        scoreGuideDetail.classList.remove("hidden");
        if (scoreGuideArrow) scoreGuideArrow.classList.add("rotate-180");
      } else {
        scoreGuideDetail.classList.add("hidden");
        if (scoreGuideArrow) scoreGuideArrow.classList.remove("rotate-180");
      }
    });
  }

  setupAnalyzerEvents();
}

// =============================================================
// 15. 소재 환산 점수 툴팁 팝오버 제어 (카드 내 ? 아이콘)
// =============================================================
window.toggleScoreTooltip = function(btn, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const popover = btn.parentElement ? btn.parentElement.querySelector(".score-tooltip-popover") : null;
  if (!popover) return;
  const isHidden = popover.classList.contains("hidden");
  document.querySelectorAll(".score-tooltip-popover").forEach(p => p.classList.add("hidden"));
  if (isHidden) {
    popover.classList.remove("hidden");
  } else {
    popover.classList.add("hidden");
  }
};

// =============================================================
// 16. 이용약관 및 개인정보처리방침 모달 제어
// =============================================================
window.openTermsModal = function() {
  const modal = document.getElementById("terms-modal");
  if (modal) modal.classList.remove("hidden");
};

window.closeTermsModal = function() {
  const modal = document.getElementById("terms-modal");
  if (modal) modal.classList.add("hidden");
};

window.openPrivacyModal = function() {
  const modal = document.getElementById("privacy-modal");
  if (modal) modal.classList.remove("hidden");
};

window.closePrivacyModal = function() {
  const modal = document.getElementById("privacy-modal");
  if (modal) modal.classList.add("hidden");
};

// =============================================================
// 17. 앱 시작
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  setupResponsivePCView();
  window.addEventListener("resize", setupResponsivePCView);
  setupEventListeners();

  // 툴팁 외부 영역 클릭 시 닫기
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".score-tooltip-btn") && !e.target.closest(".score-tooltip-popover")) {
      document.querySelectorAll(".score-tooltip-popover").forEach(p => p.classList.add("hidden"));
    }
  });

  document.getElementById("terms-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "terms-modal") window.closeTermsModal();
  });
  document.getElementById("privacy-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "privacy-modal") window.closePrivacyModal();
  });

  updateCompareUI();
  initData();
});
