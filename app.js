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
  { id: 1, brand: "유니클로", name: "수피마 코튼 크루넥T", price: 19900, fabric: "면(수피마 코튼) 100%", link: "https://www.uniqlo.com/kr/ko/products/E422992-000/00", isSponsored: false },
  { id: 2, brand: "ZARA", name: "소프트 니트 스웨터", price: 49900, fabric: "폴리에스터 58%, 아크릴 36%, 울 6%", link: "https://www.zara.com", isSponsored: false },
  { id: 3, brand: "무신사스탠다드", name: "캐시미어 블렌드 라운드넥 니트", price: 58900, fabric: "울 60%, 캐시미어 10%, 나일론 30%", link: "https://www.musinsa.com/products/996636", isSponsored: false },
  { id: 4, brand: "스파오", name: "클래식 옥스포드 셔츠", price: 29900, fabric: "면 100%", link: "https://spao.com", isSponsored: false },
  { id: 5, brand: "H&M", name: "릴랙스핏 프리미엄 울 블렌드 코트", price: 149000, fabric: "겉감: 울 50%, 폴리에스터 45%, 기타 5% / 안감: 폴리에스터 100%", link: "https://www2.hm.com", isSponsored: false },
  { id: 6, brand: "탑텐", name: "에코 웜 모달 긴팔 티셔츠", price: 15900, fabric: "모달 48%, 면 48%, 폴리우레탄 4%", link: "https://topten.topten10mall.com", isSponsored: false },
  { id: 7, brand: "무신사스탠다드", name: "[시티 레저] 후디드 라이트 다운 재킷 [블랙]", price: 109900, fabric: "겉감: 폴리에스터 100%, 안감: 나일론 100%, 충전재: 덕다운 (오리 솜털 80%, 오리 깃털 20%)", link: "https://www.musinsa.com/products/4356794", isSponsored: false },
  { id: 8, brand: "스파오", name: "[씬라이트] 여성 시어 후드 재킷_SPJPG4TG25", price: 69900, fabric: "겉감: 나일론 100%, 안감: 나일론 100%, 충전재: 폴리에스터 100%", link: "https://www.spao.com/i/item?itemNo=2608016293&lowerVendNo=LV26000002&pageId=1795096632474&preCornerNo=R13720001_categoryItem", isSponsored: false }
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
  const higherFabric = a.score > b.score ? a : (b.score > a.score ? b : null);
  const fabricText = higherFabric ? `천연섬유 비중 ${higherFabric.brand} 우세` : "천연섬유 비중 동일 수준";
  return `[옷라벨 1:1 비교] ${a.brand} vs ${b.brand} (공식 온라인몰 표기 기준)\n• 소재 점수: ${a.score}점 vs ${b.score}점 (${fabricText})\n• 가성비 지수: ${a.costPerf} pt vs ${b.costPerf} pt (정가 기준 환산)\n※ 공식 온라인몰 공시 혼용률 기반의 객관적 분석 지표입니다.\n`;
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
    <div class="space-y-3 animate-pulse">
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
            isSponsored
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

  const searchInput = document.getElementById("search-input");
  const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
  
  let filtered = products.filter(p => {
    // 브랜드 필터
    const matchBrand = selectedBrand === "ALL" || p.brand.toLowerCase() === selectedBrand.toLowerCase();
    
    // 카테고리 필터
    const matchCategory = selectedCategory === "ALL" || (p.category && p.category === selectedCategory);

    // 검색어 필터
    const matchSearch = p.name.toLowerCase().includes(term) || 
                        p.fabric.toLowerCase().includes(term) ||
                        p.brand.toLowerCase().includes(term);

    return matchBrand && matchCategory && matchSearch;
  });

  // 정렬(Sort) 적용
  filtered.sort((a, b) => {
    if (selectedSort === "costPerf") return b.costPerf - a.costPerf;
    if (selectedSort === "score") return b.score - a.score;
    if (selectedSort === "priceAsc") return a.price - b.price;
    // 추천순: 스폰서 상품 우선, 그 외 id 순
    if (a.isSponsored && !b.isSponsored) return -1;
    if (!a.isSponsored && b.isSponsored) return 1;
    return a.id - b.id;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 space-y-2.5 my-2">
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
    const isSelected = compareList.some(item => item.id === p.id);
    const card = document.createElement("div");

    const sponsorClass = p.isSponsored ? 'sponsor-glow border-amber-300' : '';
    card.className = `p-4 rounded-2xl border transition-all ${
      isSelected 
        ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-200 shadow-md' 
        : `bg-white border-gray-200 hover:border-gray-300 shadow-sm ${sponsorClass}`
    }`;

    let barColor = "bg-indigo-600";
    let scoreColor = "text-indigo-600";
    let badgeBg = "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (p.score >= 88) {
      barColor = "bg-emerald-500"; scoreColor = "text-emerald-700"; badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
    } else if (p.score >= 75) {
      barColor = "bg-indigo-600"; scoreColor = "text-indigo-600"; badgeBg = "bg-indigo-50 text-indigo-700 border-indigo-200";
    } else if (p.score >= 60) {
      barColor = "bg-amber-500"; scoreColor = "text-amber-700"; badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
    } else {
      barColor = "bg-rose-500"; scoreColor = "text-rose-600"; badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
    }

    // 혼용률 핵심 배지 생성
    const componentChips = (p.analysis && p.analysis.components.length > 0)
      ? p.analysis.components.slice(0, 3).map(c => 
          `<span class="badge-ratio text-[10px] font-bold bg-white text-gray-800 px-2 py-0.5 rounded-md border border-gray-300 shadow-2xs">${escapeHTML(c.name)} ${c.percent}%</span>`
        ).join("")
      : `<span class="badge-ratio text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">${escapeHTML(p.analysis?.keySummary || "라벨 확인 필요")}</span>`;

    // 스폰서/제휴 뱃지 HTML (공정거래위원회 심사지침 준수)
    const sponsorBadge = p.isSponsored
      ? `<span class="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs" title="공정거래위원회 심사지침에 따른 제휴 마케팅 추천 상품입니다."><i class="fa-solid fa-rectangle-ad text-[9px] text-amber-700"></i>추천·제휴광고</span>`
      : '';

    // 카테고리 태그
    const categoryBadge = p.category ? `<span class="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">${escapeHTML(p.category)}</span>` : '';

    const safeBrand = escapeHTML(p.brand);
    const safeName = escapeHTML(p.name);
    const safeFabric = escapeHTML(p.fabric);
    const jsBrand = escapeJS(p.brand);
    const jsName = escapeJS(p.name);
    const jsLink = escapeJS(p.link || "#");

    card.innerHTML = `
      ${sponsorBadge ? `<div class="mb-2 flex items-center justify-between">${sponsorBadge} <span class="text-[9px] text-amber-800 font-medium">공정위 지침 준수 광고</span></div>` : ''}
      
      <!-- 상단: 브랜드, 카테고리, 가성비, 상품명, 가격 -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-1 flex-wrap">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeBg}">${safeBrand}</span>
            ${categoryBadge}
            <span class="text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">가성비 ${p.costPerf} pt</span>
            ${p.analysis?.grade ? `<span class="text-[10px] text-gray-500 font-medium">${escapeHTML(p.analysis.grade)}</span>` : ''}
          </div>
          <h3 class="text-xs sm:text-sm font-extrabold text-gray-900 leading-snug line-clamp-2 break-keep">${safeName}</h3>
        </div>
        <div class="text-right whitespace-nowrap pl-1">
          <span class="text-xs sm:text-sm font-black text-gray-900">${p.price > 0 ? p.price.toLocaleString() + '원' : '가격 미정'}</span>
        </div>
      </div>

      <!-- 소재 점수 직관적 게이지 바 및 혼용률 배지 -->
      <div class="my-3 bg-gray-50/90 rounded-xl p-3 border border-gray-100 space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-[11px] font-bold text-gray-700 flex items-center gap-1">
            <i class="fa-solid fa-gauge-high text-indigo-500 text-[10px]"></i>
            소재 환산 지표
          </span>
          <div class="flex items-center gap-1">
            <span class="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">공식몰 표기 기준</span>
            <span class="text-sm font-black ${scoreColor}">${p.score}<span class="text-[10px] text-gray-400 font-normal">/100점</span></span>
          </div>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
          <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${p.score}%"></div>
        </div>
        <div class="pt-1 space-y-1.5">
          <div class="flex flex-wrap gap-1.5">${componentChips}</div>
          <p class="text-[11px] text-gray-600 leading-snug break-words break-keep line-clamp-2">
            <span class="font-semibold text-gray-700">공식 표기 케어라벨:</span> ${safeFabric}
          </p>
        </div>
      </div>

      <!-- 하단 버튼: [공식몰 바로가기 ↗] + [맞대결 담기] -->
      <div class="flex items-center gap-2 pt-1">
        <button onclick="handleOutboundClick('${jsBrand}','${jsName}','${jsLink}')"
           class="flex-1 py-2 px-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95 text-center cursor-pointer min-w-0" title="해당 브랜드 공식 온라인몰 또는 판매처로 이동합니다.">
          <span class="truncate">공식몰 바로가기</span>
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-gray-500 shrink-0"></i>
        </button>

        <button onclick="toggleCompare(${p.id})" 
                class="py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 whitespace-nowrap active:scale-95 shadow-xs cursor-pointer shrink-0 ${
                  isSelected 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-900 text-white hover:bg-black'
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
      ? "brand-btn active whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white transition-all shadow-sm"
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

  const bottomBar = document.getElementById("compare-bottom-bar");
  if (bottomBar) {
    if (compareList.length > 0) {
      bottomBar.classList.remove("hidden");
    } else {
      bottomBar.classList.add("hidden");
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
}

// =============================================================
// 12. 1:1 맞대결 모달 (가격 차이, 혼용률 수치 강조, 공식몰 링크)
// =============================================================
function openModal() {
  const modal = document.getElementById("compare-modal");
  const content = document.getElementById("modal-content");
  const shareBtn = document.getElementById("modal-share-btn");
  if (!modal || !content) return;

  if (compareList.length === 2 && shareBtn) {
    shareBtn.classList.remove("hidden");
  } else if (shareBtn) {
    shareBtn.classList.add("hidden");
  }

  if (compareList.length === 0) {
    content.innerHTML = `
      <div class="text-center py-12 space-y-2">
        <i class="fa-solid fa-scale-unbalanced text-3xl text-gray-300"></i>
        <p class="text-xs font-bold text-gray-700">비교함에 담긴 상품이 없습니다.</p>
        <p class="text-[11px] text-gray-400">상품 카드에서 [맞대결 담기]를 눌러 두 상품을 골라보세요!</p>
      </div>
    `;
  } else if (compareList.length === 1) {
    const item = compareList[0];
    const safeBrand = escapeHTML(item.brand);
    const safeName = escapeHTML(item.name);
    const safeFabric = escapeHTML(item.fabric);
    const jsBrand = escapeJS(item.brand);
    const jsName = escapeJS(item.name);
    const jsLink = escapeJS(item.link || "#");

    content.innerHTML = `
      <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-indigo-900 text-xs flex items-center gap-2">
        <i class="fa-solid fa-circle-question text-indigo-600 text-sm shrink-0"></i>
        <span>상대할 <strong>두 번째 상품</strong>을 목록에서 추가로 선택해주세요!</span>
      </div>

      <div class="border border-indigo-200 rounded-2xl p-3 sm:p-4 bg-white shadow-sm mt-3 space-y-3">
        <div class="flex justify-between items-start gap-2">
          <span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 truncate max-w-[120px]">${safeBrand}</span>
          <span class="text-xs font-black text-gray-900 whitespace-nowrap">${item.price > 0 ? item.price.toLocaleString() + '원' : '가격 미정'}</span>
        </div>
        <h4 class="text-xs font-bold text-gray-900 break-keep">${safeName}</h4>
        
        <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1.5">
          <div class="flex justify-between text-[11px]">
            <span class="text-gray-500 font-semibold">소재 퀄리티 점수</span>
            <span class="font-black text-indigo-600">${item.score}점</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-indigo-600 h-2 rounded-full" style="width: ${item.score}%"></div>
          </div>
          <p class="text-[11px] text-gray-700 pt-1 font-medium break-words break-keep">${safeFabric}</p>
        </div>

        <button onclick="handleOutboundClick('${jsBrand}','${jsName}','${jsLink}')"
           class="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
          <span class="truncate">공식몰에서 실물 및 상세 보기</span>
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-gray-500 shrink-0"></i>
        </button>
      </div>
    `;
  } else {
    const [a, b] = compareList;
    const priceDiff = Math.abs(a.price - b.price);
    const scoreDiff = Math.abs(a.score - b.score);
    const cheaper = a.price < b.price ? a : (a.price > b.price ? b : null);
    const betterFabric = a.score > b.score ? a : (a.score < b.score ? b : null);
    const betterCostPerf = a.costPerf > b.costPerf ? a : (a.costPerf < b.costPerf ? b : null);

    const aBadges = a.analysis?.components?.length > 0
      ? a.analysis.components.slice(0, 3).map(c => `<span class="badge-ratio text-[10px] font-bold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">${escapeHTML(c.name)} ${c.percent}%</span>`).join(" ")
      : `<span class="text-[10px] text-gray-500">${escapeHTML(a.analysis?.keySummary || "라벨 확인 권장")}</span>`;

    const bBadges = b.analysis?.components?.length > 0
      ? b.analysis.components.slice(0, 3).map(c => `<span class="badge-ratio text-[10px] font-bold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">${escapeHTML(c.name)} ${c.percent}%</span>`).join(" ")
      : `<span class="text-[10px] text-gray-500">${escapeHTML(b.analysis?.keySummary || "라벨 확인 권장")}</span>`;

    const aSafeBrand = escapeHTML(a.brand);
    const aSafeName = escapeHTML(a.name);
    const aSafeFabric = escapeHTML(a.fabric);
    const aJsBrand = escapeJS(a.brand);
    const aJsName = escapeJS(a.name);
    const aJsLink = escapeJS(a.link || "#");

    const bSafeBrand = escapeHTML(b.brand);
    const bSafeName = escapeHTML(b.name);
    const bSafeFabric = escapeHTML(b.fabric);
    const bJsBrand = escapeJS(b.brand);
    const bJsName = escapeJS(b.name);
    const bJsLink = escapeJS(b.link || "#");

    // 가격 차이 안내 문구 (공식 정가 기준 객관적 표기)
    let priceComparisonBadge = "";
    if (a.price === b.price) {
      priceComparisonBadge = `<span class="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">정가 동일</span>`;
    } else if (cheaper) {
      priceComparisonBadge = `<span class="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full inline-block leading-snug">
        ${escapeHTML(cheaper.brand)} 공식 정가 기준 ${priceDiff.toLocaleString()}원 낮음
      </span>`;
    }

    content.innerHTML = `
      <!-- 가격 차이 하이라이트 배너 -->
      <div class="p-2.5 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 border border-indigo-100 flex items-center justify-between gap-1">
        <div class="text-[11px] font-bold text-gray-800 flex items-center gap-1.5 shrink-0">
          <i class="fa-solid fa-coins text-amber-500"></i>
          <span>공식 정가 비교:</span>
        </div>
        <div class="text-right min-w-0">${priceComparisonBadge}</div>
      </div>

      <!-- 1:1 대결 상단 카드 (2열 - 모바일 360px 대응 min-w-0 적용) -->
      <div class="grid grid-cols-2 gap-2 text-center">
        <!-- A 상품 -->
        <div class="bg-white p-2.5 sm:p-3 rounded-2xl border flex flex-col justify-between min-w-0 ${betterFabric?.id === a.id ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-sm' : 'border-gray-200'}">
          <div class="min-w-0">
            <div class="flex items-center justify-between gap-1 mb-1 flex-wrap">
              <span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 truncate max-w-[76px] sm:max-w-[100px]">${aSafeBrand}</span>
              ${betterFabric?.id === a.id ? '<span class="text-[9px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full shrink-0">천연섬유 우세</span>' : ''}
            </div>
            <h4 class="text-xs font-bold text-gray-900 mt-1 line-clamp-2 text-left leading-tight break-words break-keep">${aSafeName}</h4>
            <p class="text-xs sm:text-sm font-black text-gray-900 mt-1 text-left whitespace-nowrap">${a.price > 0 ? a.price.toLocaleString() + '원' : '가격 미정'}</p>
            ${cheaper?.id === a.id && priceDiff > 0 ? `<p class="text-[10px] font-bold text-emerald-700 text-left truncate">(정가 -${priceDiff.toLocaleString()}원 차이)</p>` : ''}
          </div>
          <button onclick="handleOutboundClick('${aJsBrand}','${aJsName}','${aJsLink}')"
             class="mt-2.5 w-full py-1.5 px-1 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer min-w-0">
            <span class="truncate">공식몰 바로가기</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-gray-500 shrink-0"></i>
          </button>
        </div>
        
        <!-- B 상품 -->
        <div class="bg-white p-2.5 sm:p-3 rounded-2xl border flex flex-col justify-between min-w-0 ${betterFabric?.id === b.id ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-sm' : 'border-gray-200'}">
          <div class="min-w-0">
            <div class="flex items-center justify-between gap-1 mb-1 flex-wrap">
              <span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 truncate max-w-[76px] sm:max-w-[100px]">${bSafeBrand}</span>
              ${betterFabric?.id === b.id ? '<span class="text-[9px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full shrink-0">천연섬유 우세</span>' : ''}
            </div>
            <h4 class="text-xs font-bold text-gray-900 mt-1 line-clamp-2 text-left leading-tight break-words break-keep">${bSafeName}</h4>
            <p class="text-xs sm:text-sm font-black text-gray-900 mt-1 text-left whitespace-nowrap">${b.price > 0 ? b.price.toLocaleString() + '원' : '가격 미정'}</p>
            ${cheaper?.id === b.id && priceDiff > 0 ? `<p class="text-[10px] font-bold text-emerald-700 text-left truncate">(정가 -${priceDiff.toLocaleString()}원 차이)</p>` : ''}
          </div>
          <button onclick="handleOutboundClick('${bJsBrand}','${bJsName}','${bJsLink}')"
             class="mt-2.5 w-full py-1.5 px-1 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer min-w-0">
            <span class="truncate">공식몰 바로가기</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-gray-500 shrink-0"></i>
          </button>
        </div>
      </div>

      <!-- 정밀 비교 바 및 수치 대조 -->
      <div class="bg-gray-50 rounded-2xl p-3 sm:p-3.5 space-y-3.5 border border-gray-200">
        <!-- 소재 점수 맞대결 게이지 -->
        <div>
          <div class="flex justify-between items-center text-[11px] font-bold text-gray-700 mb-1.5 gap-1">
            <span class="truncate max-w-[90px] sm:max-w-[120px] ${betterFabric?.id === a.id ? 'text-indigo-600 font-black' : ''}">${aSafeBrand} (${a.score}점)</span>
            <span class="text-[10px] text-gray-400 font-semibold shrink-0">소재 지표 비교 (공식 표기 기준)</span>
            <span class="truncate max-w-[90px] sm:max-w-[120px] text-right ${betterFabric?.id === b.id ? 'text-indigo-600 font-black' : ''}">(${b.score}점) ${bSafeBrand}</span>
          </div>
          <div class="grid grid-cols-2 gap-1 h-3">
            <div class="bg-gray-200 rounded-l-full overflow-hidden flex justify-end">
              <div class="bg-indigo-600 h-full rounded-l-full transition-all duration-500" style="width: ${a.score}%"></div>
            </div>
            <div class="bg-gray-200 rounded-r-full overflow-hidden flex justify-start">
              <div class="bg-indigo-600 h-full rounded-r-full transition-all duration-500" style="width: ${b.score}%"></div>
            </div>
          </div>
        </div>

        <!-- 핵심 혼용률 수치 강조 배지 -->
        <div class="pt-2 border-t border-gray-200">
          <div class="text-[10px] font-bold text-gray-500 text-center mb-1.5">핵심 섬유 비율 (Top 3)</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-white p-2 rounded-xl border border-gray-200 flex flex-wrap gap-1 justify-center min-w-0">${aBadges}</div>
            <div class="bg-white p-2 rounded-xl border border-gray-200 flex flex-wrap gap-1 justify-center min-w-0">${bBadges}</div>
          </div>
        </div>

        <!-- 케어라벨 원문 대조 -->
        <div class="pt-2 border-t border-gray-200">
          <div class="text-[10px] font-bold text-gray-500 text-center mb-1.5">케어라벨 공식 표기 원문</div>
          <div class="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
            <div class="bg-white p-2 sm:p-2.5 rounded-xl border border-gray-200 text-gray-800 font-medium break-words break-keep leading-tight overflow-hidden">${aSafeFabric}</div>
            <div class="bg-white p-2 sm:p-2.5 rounded-xl border border-gray-200 text-gray-800 font-medium break-words break-keep leading-tight overflow-hidden">${bSafeFabric}</div>
          </div>
        </div>

        <!-- 가성비 지수 -->
        <div class="pt-2 border-t border-gray-200 flex justify-around text-center">
          <div>
            <span class="text-[10px] text-gray-400 block font-medium">가성비 환산 지수 (참고용)</span>
            <span class="text-xs font-black ${betterCostPerf?.id === a.id ? 'text-indigo-600' : 'text-gray-900'}">${a.costPerf} pt</span>
          </div>
          <div class="w-px bg-gray-200 h-6"></div>
          <div>
            <span class="text-[10px] text-gray-400 block font-medium">가성비 환산 지수 (참고용)</span>
            <span class="text-xs font-black ${betterCostPerf?.id === b.id ? 'text-indigo-600' : 'text-gray-900'}">${b.costPerf} pt</span>
          </div>
        </div>

        <!-- 세탁 관리 팁 -->
        <div class="pt-2 border-t border-gray-200">
          <div class="text-[10px] font-bold text-gray-500 text-center mb-1.5">스마트 세탁 & 관리 팁 대조</div>
          <div class="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
            <div class="bg-white p-2 rounded-xl border border-gray-200 min-w-0">
              <ul class="list-disc pl-3 space-y-0.5 break-words break-keep">
                ${a.analysis?.careTips?.slice(0, 2).map(tip => `<li>${escapeHTML(tip)}</li>`).join("") || '<li>표준 세탁 권장</li>'}
              </ul>
            </div>
            <div class="bg-white p-2 rounded-xl border border-gray-200 min-w-0">
              <ul class="list-disc pl-3 space-y-0.5 break-words break-keep">
                ${b.analysis?.careTips?.slice(0, 2).map(tip => `<li>${escapeHTML(tip)}</li>`).join("") || '<li>표준 세탁 권장</li>'}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 케어라벨 객관적 비교 요약 (공식 온라인몰 공시 기준) -->
      <div class="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3 sm:p-3.5 text-xs text-indigo-950 space-y-2 shadow-xs">
        <div class="font-extrabold flex items-center justify-between text-indigo-800">
          <span class="flex items-center gap-1.5">
            <i class="fa-solid fa-circle-check text-indigo-600"></i>
            <span>케어라벨 객관적 비교 요약</span>
          </span>
          <span class="text-[9px] font-semibold text-indigo-600 bg-white/90 px-2 py-0.5 rounded-full border border-indigo-200">공식몰 공시 기준</span>
        </div>
        <div class="text-[11px] leading-relaxed space-y-1.5 break-keep text-gray-700">
          <p>• <strong>소재 혼용 지표:</strong> ${betterFabric ? `<strong>${escapeHTML(betterFabric.brand)}</strong>이(가) 천연·고급 섬유 혼용률 산출 점수에서 <strong>+${scoreDiff}점</strong> 높게 집계되었습니다.` : '두 제품의 공학적 섬유 혼용 환산 점수가 동일합니다.'}</p>
          <p>• <strong>공식 정가 비교:</strong> ${cheaper && priceDiff > 0 ? `공식 온라인몰 기준 정가는 <strong>${escapeHTML(cheaper.brand)}</strong>이(가) <strong>${priceDiff.toLocaleString()}원</strong> 낮습니다. <span class="text-[10px] text-gray-500">(할인 쿠폰·프로모션에 따라 실구매가는 상이할 수 있습니다.)</span>` : '두 제품의 공식몰 정가가 동일합니다.'}</p>
          <p>• <strong>가성비 환산 지수:</strong> ${betterCostPerf ? `정가 대비 섬유 점수 비례 지수는 <strong>${escapeHTML(betterCostPerf.brand)}</strong>이(가) 더 높게 산출됩니다.` : '정가 대비 섬유 비례 지수가 유사합니다.'} <span class="text-[10px] text-gray-500">(원단 밀도, 편직 방식 등은 반영되지 않은 단순 혼용률/정가 기준 수치입니다.)</span></p>
        </div>
        <div class="pt-2 border-t border-indigo-100/80 text-[10px] text-gray-500 leading-normal flex items-start gap-1">
          <i class="fa-solid fa-circle-info text-[9px] text-indigo-500 mt-0.5 shrink-0"></i>
          <span>본 비교는 각 브랜드 공식 온라인몰에 공시된 케어라벨 혼용률 및 정가 기준의 기계적 분석 결과이며, 상품의 품질 전반에 대한 우열 단정이 아닙니다. 최종 구매 전 해당 제조사/판매사의 최신 상세 정보를 확인하시기 바랍니다.</span>
        </div>
      </div>
    `;
  }

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
        target.className = "brand-btn active whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white transition-all shadow-sm";
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

  setupAnalyzerEvents();
}

// =============================================================
// 15. 앱 시작
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  initData();
});
