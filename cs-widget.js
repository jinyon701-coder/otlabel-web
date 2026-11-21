/**
 * ============================================================================
 * Otlabel (옷라벨) - AI CS Assistant Widget (cs-widget.js)
 * ----------------------------------------------------------------------------
 * 1. 우측 하단 플로팅 원형 버튼 및 실시간 상태 배지
 * 2. 슬라이드업/페이드인 CS 챗봇 팝업 (헤더, FAQ 퀵버튼 4종, 스마트 키워드 챗봇)
 * 3. 원단 오류 수정 및 브랜드 제휴 제보/문의 접수 폼 (내용 복사 & mailto: 지원)
 * 4. 모바일(360px~430px) 및 데스크톱 반응형, z-45 z-index 조율
 * ============================================================================
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 상수 및 상태 정의
  // -------------------------------------------------------------
  const OFFICIAL_EMAIL = 'kimjy89701@gmail.com';

  const FAQ_DATA = {
    composition: {
      title: '🏷️ 혼용률 보는 법',
      query: '혼용률 보는 법 알려줘',
      response: `**🏷️ 옷라벨 혼용률 완벽 분석 가이드**

의류 원단은 크게 **천연섬유**와 **합성섬유**로 나뉘며, 황금 비율이 착용감과 내구성을 결정합니다.

**1. 천연섬유 (면, 린넨, 울, 실크 등)**
• **장점**: 우수한 통기성, 땀 흡수력, 피부 자극이 적고 고급스러운 터치감
• **단점**: 세탁 시 수축 위험, 구김 발생, 물에 젖었을 때 건조가 느림

**2. 합성섬유 (폴리에스터, 나일론, 스판덱스 등)**
• **장점**: 강력한 인장 강도와 내구성, 구김 방지, 탁월한 속건성(빠른 건조)
• **단점**: 정전기 발생, 통기성 부족, 마찰 부위 보풀(필링) 발생 주의

💡 **카테고리별 이상적인 황금 혼용률**:
• **데일리 티셔츠**: 면 80% + 폴리 20% (부드러움과 형태 유지의 최적 균형)
• **슬랙스/팬츠**: 폴리 65% + 레이온 30% + 스판 5% (탄력성과 링클프리)
• **겨울 니트/코트**: 울 70% 이상 + 캐시미어 10% 이상 (가벼움과 극상의 보온성)`
    },
    price: {
      title: '💰 가격/재고 차이',
      query: '가격과 재고가 왜 다른가요?',
      response: `**💰 공식몰 가격/재고 실시간 변동 안내**

옷라벨은 각 브랜드 공식 스토어의 상품 정보를 정기 크롤링하여 업데이트하고 있습니다.

다만, 아래 사유로 인해 일시적인 차이가 발생할 수 있습니다:
1. **브랜드 기습 타임 세일**: 공식몰의 한정 시간 게릴라 할인 또는 라이브 특가
2. **회원 전용 등급 쿠폰**: 로그인 시 적용되는 개인별 추가 할인 혜택
3. **실시간 품절/리오더**: 인기 색상·사이즈의 순간 품절

🔍 **실시간 확인 팁**:
각 의류 카드의 **[공식몰 바로가기]** 버튼을 탭하시면 해당 브랜드 공식몰로 이동하여 현재 시점의 최종 결제가격과 재고를 즉시 확인하실 수 있습니다.`
    },
    report: {
      title: '📝 원단 정보 수정/제보',
      query: '원단 정보 수정/제보 안내',
      response: `**📝 잘못된 라벨 정보 제보 가이드**

옷라벨은 제조사가 공식 표기한 케어라벨 데이터를 기반으로 산출되며, **유저 여러분의 집단지성 제보**를 통해 실시간으로 데이터 품질을 높이고 있습니다!

• 공식몰 상세페이지와 다른 혼용률을 발견하셨나요?
• 오프라인 매장 실물 케어라벨과 표기가 다른가요?
• 신규 등록을 원하는 인기 아이템이 있으신가요?

• **공식 제보 이메일**: \`${OFFICIAL_EMAIL}\`
상단의 **[✍️ 오류 제보/문의]** 탭을 클릭하시거나 공식 이메일(\`${OFFICIAL_EMAIL}\`)로 실물 라벨 사진과 내용을 보내주시면 검증 후 데이터베이스에 즉각 반영됩니다.`,
      actionBtn: { text: '✍️ 오류 제보 폼 열기', action: 'openReportTab' }
    },
    partnership: {
      title: '🤝 브랜드 제휴/입점',
      query: '브랜드 제휴 및 입점 안내',
      response: `**🤝 브랜드 제휴 및 구글 시트 데이터 연동 안내**

옷라벨은 객관적인 원단 스펙을 투명하게 소비자에게 알리고자 하는 SPA & 디자이너 브랜드를 환영합니다.

• **입점 방식**: 상품 마스터 데이터(구글 스프레드시트 또는 CSV 피드) 간편 연동
• **주요 혜택**:
  - 케어라벨 스펙 기반 1:1 맞대결 큐레이션 노출
  - 구매 전환율이 높은 공식 스토어 아웃바운드 링크 연결
• **브랜드 제휴 전용 창구**: \`${OFFICIAL_EMAIL}\`

브랜드 소개서 또는 상품 시트 링크를 공식 이메일(\`${OFFICIAL_EMAIL}\`)로 보내주시면 담당자가 영업일 기준 24시간 내 신속히 검토 후 회신드립니다.`
    }
  };

  // -------------------------------------------------------------
  // 키워드 분석 지능형 응답 딕셔너리
  // -------------------------------------------------------------
  const KEYWORD_RULES = [
    {
      keywords: ['면', '코튼', 'cotton', '수피마', '순면'],
      response: `**🌱 면 (Cotton / 코튼) 섬유 가이드**

• **특징**: 목화씨의 솜으로 만든 대표 천연섬유입니다. 피부 자극이 거의 없고 흡습성과 통기성이 매우 뛰어납니다.
• **장점**: 부드러운 촉감, 땀 흡수 우수, 세탁 및 열에 강함
• **주의점**: 물세탁 시 3~5% 자연 수축이 발생할 수 있으며 구김이 잘 생깁니다.
• **세탁 팁**: 첫 세탁은 찬물 또는 30℃ 이하 미온수 세탁을 권장하며, 고온 건조기 사용 시 수축될 수 있으니 자연 건조를 권장합니다.`
    },
    {
      keywords: ['폴리', '폴리에스터', 'polyester', '합성섬유'],
      response: `**🧪 폴리에스터 (Polyester / 폴리) 섬유 가이드**

• **특징**: 인류가 가장 많이 사용하는 합성섬유로, 가볍고 강도가 매우 뛰어납니다.
• **장점**: 구김이 거의 없고, 세탁 후 건조가 매우 빠르며 형태 변형이 적습니다.
• **주의점**: 정전기가 잘 발생하고, 마찰 시 표면에 보풀(필링)이 생길 수 있습니다.
• **황금 비율 팁**: 면이나 울과 혼방(예: 면 80%+폴리 20%)되면 구김 방지와 내구성이 대폭 강화됩니다.`
    },
    {
      keywords: ['울', '모', '캐시미어', '알파카', 'wool', 'cashmere', '니트', '가디건', '코트'],
      response: `**🐑 울 & 캐시미어 (Wool / Cashmere) 동물성 섬유 가이드**

• **특징**: 천연 크림프(꼬임) 구조로 공기층을 형성하여 겨울철 최고의 보온성과 통기성을 제공합니다.
• **장점**: 탁월한 보온력, 고급스러운 광택감, 자연스러운 탄력 및 복원력
• **주의점**: 열과 마찰, 알칼리성 세제에 매우 취약하여 뜨거운 물 세탁 시 치명적인 수축(펠트화)이 일어납니다.
• **세탁 팁**: 반드시 **드라이클리닝** 또는 30℃ 이하 미온수에 **중성세제(울샴푸)**로 단독 손세탁 후 그늘에 뉘어서 건조하세요.`
    },
    {
      keywords: ['린넨', '마', 'linen'],
      response: `**🌿 린넨 (Linen / 마) 천연 여름 섬유 가이드**

• **특징**: 아마 식물의 줄기에서 얻은 천연 섬유로, 여름철 대표 냉감 소재입니다.
• **장점**: 열전도율이 높아 시원하고 땀 흡수와 배출이 매우 빠릅니다.
• **주의점**: 탄성이 적어 주름이 매우 잘 생기며, 초기 세탁 시 잔사가 나올 수 있습니다.
• **관리 팁**: 비틀어 짜지 말고 가볍게 털어 그늘에서 말리면 자연스러운 구김 멋이 살아납니다.`
    },
    {
      keywords: ['레이온', '비스코스', '모달', '텐셀', 'rayon', 'viscose', 'modal', 'tencel'],
      response: `**✨ 레이온 & 모달 & 텐셀 (재생 섬유) 가이드**

• **특징**: 목재 펄프를 원료로 실크의 촉감을 재현한 친환경 재생 섬유입니다.
• **장점**: 실크처럼 부드러운 드레이프성, 차르르 떨어지는 광택, 뛰어난 흡습성
• **주의점**: 물에 젖었을 때 섬유 강도가 50%가량 감소하므로 세탁기 강한 탈수 시 찢어지거나 줄어들 수 있습니다.
• **세탁 팁**: 세탁망에 넣어 울코스로 단독 세탁하시거나 미온수 손세탁을 추천합니다.`
    },
    {
      keywords: ['스판', '스판덱스', '엘라스테인', '폴리우레탄', 'span', '신축성', '탄력'],
      response: `**🤸‍♂️ 스판덱스 / 엘라스테인 (Polyurethane / Span) 가이드**

• **특징**: 고무실 대비 3배 이상의 강력한 탄성 복원력을 가진 고기능성 탄성 섬유입니다.
• **장점**: 단 2~5% 혼용만으로도 놀라운 신축성과 편안한 활동성을 부여합니다.
• **주의점**: 열에 극히 약합니다. 고온 다림질이나 고온 건조기에 노출되면 고무 탄성사가 끊어져 바지 무릎이 늘어납니다. 저온 세탁 및 자연 건조가 필수입니다.`
    },
    {
      keywords: ['나일론', 'nylon'],
      response: `**🛡️ 나일론 (Nylon) 고강도 합성 섬유 가이드**

• **특징**: 섬유 중 가장 마찰에 강하고 질기며 가벼운 슈퍼 섬유입니다.
• **장점**: 탁월한 방풍·발수성, 찢어짐에 강해 아우터(윈드브레이커, 패딩 겉감), 가방에 필수 소재로 사용됩니다.
• **세탁 팁**: 열에 약하므로 고온 다림질을 피하고 미온수 세탁을 권장합니다.`
    },
    {
      keywords: ['세탁', '빨래', '세탁기', '손세탁', '물세탁', '드라이', '드라이클리닝', '울샴푸', '중성세제'],
      response: `**🧺 섬유별 올바른 스마트 세탁 3대 원칙**

1. **라벨의 세탁 기호 우선 확인**: 의류 안쪽 케어라벨의 물세탁/드라이클리닝 기호를 반드시 준수하세요.
2. **미온수 + 중성세제**: 30℃ 이하의 미온수와 중성세제(울샴푸)를 사용하면 섬유 손상과 탈색을 80% 이상 줄일 수 있습니다.
3. **세탁망 필수 활용**: 지퍼나 단추를 모두 잠그고 뒤집어서 세탁망에 넣으면 원단 마찰 보풀을 획기적으로 방지합니다.`
    },
    {
      keywords: ['건조기', '수축', '줄어', '줄어듦', '줄어듬', '건조'],
      response: `**🔥 건조기 사용 시 극도로 주의해야 할 원단 TOP 4**

1. **면 100% / 순면 제품**: 고온 열풍에 원사가 수축하여 1~2사이즈 줄어들 수 있습니다.
2. **울 / 캐시미어 / 니트류**: 섬유가 엉켜 단단해지는 펠트화 현상으로 완전히 망가집니다.
3. **레이온 / 모달**: 물에 젖은 상태에서 열풍을 맞으면 심한 변형과 수축이 일어납니다.
4. **스판덱스 함유 의류**: 탄성 섬유가 열에 녹아 탄력을 잃고 축 늘어집니다.

💡 **권장 건조법**: 건조기 대신 통풍이 잘되는 그늘에서 옷걸이나 건조대에 널어 자연 건조하세요!`
    },
    {
      keywords: ['보풀', '필링', '털뭉침', '먼지'],
      response: `**🧶 의류 보풀(Pilling) 원인과 완벽 제거 팁**

• **원인**: 합성섬유(아크릴, 폴리에스터)의 강한 섬유 가닥이 마찰로 인해 엉키며 발생합니다.
• **예방법**:
  1. 마찰 방지를 위해 옷을 **뒤집어서 세탁**하세요.
  2. 세탁기 내 다른 의류와의 마찰을 줄이기 위해 **세탁망**을 사용하세요.
• **제거법**: 손으로 뜯으면 섬유가 계속 뽑혀 더 심해집니다. 회전식 보풀제거기를 가볍게 스치듯 사용하세요.`
    },
    {
      keywords: ['비교', '맞대결', '1:1', '사용법', '기능'],
      response: `**⚖️ 옷라벨 1:1 맞대결 기능 활용법**

1. 의류 카드 우측 상단의 **[저울 모양 1:1 비교 버튼]**을 클릭하세요.
2. 최대 2개 상품까지 담을 수 있으며, 하단에 맞대결 바가 나타납니다.
3. **[1:1 맞대결 보기]**를 누르면 두 상품의 **혼용률 정밀 대조, 섬유 퀄리티 점수, 가성비 지수, 공식몰 최저가**를 한눈에 비교하실 수 있습니다!`
    },
    {
      keywords: ['점수', '가성비', '계산', '알고리즘', '기준'],
      response: `**📊 옷라벨 가성비 & 퀄리티 지수 산출 공식**

• **소재 퀄리티 점수 (100점 만점)**:
  공식 케어라벨 공시치를 바탕으로 천연섬유 비중, 고밀도 편직, 기능성 스펙에 공학적 가중치를 부여하여 산출합니다.
• **가성비 지수**:
  \`(소재 퀄리티 점수 ÷ 공식 판매가격) × 1,000\`
  가격 대비 고급 섬유 스펙이 얼마나 알차게 담겼는지를 직관적인 숫자로 나타냅니다.`
    },
    {
      keywords: ['가격', '할인', '세일', '쿠폰', '비싸', '싸다', '변동'],
      response: `**🏷️ 공식몰 가격 및 실시간 할인 안내**

옷라벨에 표기된 가격은 브랜드 공식몰의 정가 및 일반 할인가 기준입니다.
브랜드별 깜짝 타임딜이나 회원 등급 할인 쿠폰에 따라 실제 결제 가격이 더 저렴할 수 있으니, 각 카드 하단의 **[공식몰 바로가기]**를 통해 최신 가격을 확인해보세요!`
    },
    {
      keywords: ['오류', '수정', '제보', '틀림', '잘못', '바뀜'],
      response: `**📢 라벨 정보 오류 제보 안내**

케어라벨 정보에 오류가 있거나 변경된 내용이 있다면 상단의 **[오류 제보/문의]** 탭을 통해 알려주세요!
상품명과 정확한 혼용률 내용을 남겨주시면 검증 즉시 구글 스프레드시트와 데이터베이스에 반영됩니다.`,
      actionBtn: { text: '✍️ 오류 제보 폼 열기', action: 'openReportTab' }
    },
    {
      keywords: ['제휴', '입점', '비즈니스', '광고', '협업', '시트', '파트너'],
      response: `**🤝 브랜드 입점 및 비즈니스 문의**

옷라벨과의 제휴를 원하시는 브랜드 관계자분께서는 \`${OFFICIAL_EMAIL}\`로 문의 메일을 보내주시면 24시간 내 친절히 안내해 드리겠습니다!`
    },
    {
      keywords: ['안녕', '반가워', '하이', '누구', '소개', '옷라벨'],
      response: `**👋 안녕하세요! 옷라벨 AI CS 어시스턴트입니다.**

의류 케어라벨 분석, 천연/합성 섬유 혼용률 비교, 올바른 세탁·건조법, 공식몰 가격 문의 등 궁금하신 모든 점을 도와드리고 있습니다.

아래 추천 질문을 누르시거나 궁금한 단어(예: *면 100% 장점, 건조기 수축, 캐시미어 보관법*)를 편하게 입력해 보세요!`
    }
  ];

  // -------------------------------------------------------------
  // HTML 템플릿 생성
  // -------------------------------------------------------------
  function createWidgetHTML() {
    return `
      <!-- 유도 말풍선 툴팁 (최초 로드 시 부드럽게 노출) -->
      <div id="cs-tooltip-bubble" class="cs-tooltip-bubble" role="tooltip" aria-live="polite">
        <div class="cs-tooltip-content">
          <span class="cs-tooltip-icon">🏷️</span>
          <span class="cs-tooltip-text">궁금한 원단 정보, AI에게 물어보세요!</span>
          <button type="button" id="cs-tooltip-close-btn" class="cs-tooltip-close" aria-label="말풍선 닫기">&times;</button>
        </div>
        <div class="cs-tooltip-arrow"></div>
      </div>

      <!-- 슬라이드업/페이드인 CS 챗봇 팝업 창 -->
      <div id="cs-chat-popup" class="cs-chat-popup hidden" role="dialog" aria-modal="true" aria-labelledby="cs-popup-title">
        
        <!-- 헤더 영역 -->
        <div class="cs-popup-header">
          <div class="cs-header-left">
            <div class="cs-bot-avatar">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h3 id="cs-popup-title" class="cs-header-title">옷라벨 AI CS 어시스턴트</h3>
                <span class="cs-status-badge">
                  <span class="cs-status-dot"></span>
                  실시간 응답중
                </span>
              </div>
              <p class="cs-header-desc">의류 라벨 분석 · 혼용률 가이드 · 오류 제보</p>
            </div>
          </div>
          <div class="cs-header-actions">
            <button type="button" id="cs-reset-chat-btn" class="cs-icon-btn" title="대화 내용 초기화" aria-label="대화 초기화">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button type="button" id="cs-close-popup-btn" class="cs-icon-btn" title="창 닫기" aria-label="챗봇 닫기">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- 탭 네비게이션: [실시간 AI 상담] vs [오류 제보/문의] -->
        <div class="cs-tabs">
          <button type="button" id="cs-tab-chat" class="cs-tab-btn active">
            <i class="fa-solid fa-comments"></i>
            <span>실시간 AI 상담</span>
          </button>
          <button type="button" id="cs-tab-report" class="cs-tab-btn">
            <i class="fa-solid fa-pen-to-square"></i>
            <span>오류 제보/문의</span>
          </button>
        </div>

        <!-- 탭 1 컨텐츠: 챗봇 화면 -->
        <div id="cs-tab-content-chat" class="cs-tab-content active">
          
          <!-- 스크롤 가능한 대화 영역 -->
          <div id="cs-messages-container" class="cs-messages-container">
            
            <!-- 환영 메시지 -->
            <div class="cs-msg-row cs-msg-bot">
              <div class="cs-msg-avatar">
                <i class="fa-solid fa-tags text-[11px]"></i>
              </div>
              <div class="cs-msg-bubble">
                <p class="cs-msg-text font-medium text-gray-800">
                  안녕하세요! <strong>옷라벨 AI CS 어시스턴트</strong>입니다. 👋<br>
                  의류 혼용률 분석, 공식몰 가격 차이 안내, 원단 오류 제보 등 무엇이든 물어보세요!
                </p>
              </div>
            </div>

            <!-- 자주 묻는 질문 퀵버튼 4종 슬롯 -->
            <div class="cs-quick-faq-wrapper">
              <p class="cs-faq-label">
                <i class="fa-solid fa-bolt text-indigo-500"></i> 자주 묻는 질문 (FAQ)
              </p>
              <div class="cs-quick-faq-grid">
                <button type="button" class="cs-faq-btn" data-faq="composition">
                  <span class="cs-faq-icon">🏷️</span>
                  <span class="cs-faq-text">혼용률 보는 법</span>
                </button>
                <button type="button" class="cs-faq-btn" data-faq="price">
                  <span class="cs-faq-icon">💰</span>
                  <span class="cs-faq-text">가격/재고 차이</span>
                </button>
                <button type="button" class="cs-faq-btn" data-faq="report">
                  <span class="cs-faq-icon">📝</span>
                  <span class="cs-faq-text">원단 정보 수정/제보</span>
                </button>
                <button type="button" class="cs-faq-btn" data-faq="partnership">
                  <span class="cs-faq-icon">🤝</span>
                  <span class="cs-faq-text">브랜드 제휴/입점</span>
                </button>
              </div>
            </div>

          </div>

          <!-- 키워드 추천 칩 바 -->
          <div class="cs-keyword-chips-bar">
            <span class="cs-chip-title">추천:</span>
            <button type="button" class="cs-chip-btn" data-query="면과 폴리 차이">면 vs 폴리</button>
            <button type="button" class="cs-chip-btn" data-query="건조기 수축 원단">건조기 수축</button>
            <button type="button" class="cs-chip-btn" data-query="울 니트 세탁법">울 세탁법</button>
            <button type="button" class="cs-chip-btn" data-query="스판 덱스 관리">스판 관리</button>
            <button type="button" class="cs-chip-btn" data-query="1:1 맞대결 사용법">맞대결 방법</button>
          </div>

          <!-- 하단 메시지 입력 바 -->
          <form id="cs-chat-form" class="cs-chat-input-area" onsubmit="return false;">
            <input type="text" id="cs-chat-input" class="cs-chat-input" 
                   placeholder="질문을 입력하세요 (예: 면 100%, 건조기, 보풀...)" 
                   autocomplete="off" maxlength="150">
            <button type="submit" id="cs-chat-send-btn" class="cs-chat-send-btn" aria-label="메시지 전송">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </form>

        </div>

        <!-- 탭 2 컨텐츠: 오류 제보 및 문의 접수 폼 -->
        <div id="cs-tab-content-report" class="cs-tab-content">
          <div class="cs-report-form-container">
            <div class="cs-report-intro">
              <h4 class="cs-report-heading">
                <i class="fa-solid fa-shield-heart text-indigo-600"></i>
                케어라벨 데이터 수정 & 제보
              </h4>
              <p class="cs-report-desc">
                잘못된 혼용률이나 가격 변동을 제보해 주시면, 검증 후 구글 스프레드시트와 옷라벨 데이터베이스에 즉시 반영됩니다.
              </p>
            </div>

            <form id="cs-report-form" class="cs-form-fields space-y-3" onsubmit="return false;">
              <!-- 1. 제보 유형 -->
              <div>
                <label for="cs-report-type" class="cs-field-label">제보 유형 <span class="text-rose-500">*</span></label>
                <select id="cs-report-type" class="cs-field-select" required>
                  <option value="라벨 혼용률 오류">라벨 혼용률 오류 (천연/합성섬유 비율 표기 오류)</option>
                  <option value="가격 및 재고 불일치">공식몰 가격 및 재고 불일치</option>
                  <option value="신규 브랜드/상품 추가 요청">신규 브랜드 / 인기 상품 추가 요청</option>
                  <option value="브랜드 제휴 및 시트 연동">브랜드 공식 제휴 및 구글 시트 연동</option>
                  <option value="기타 서비스 개선 의견">기타 서비스 개선 의견</option>
                </select>
              </div>

              <!-- 2. 제보 상품명 -->
              <div>
                <label for="cs-report-product" class="cs-field-label">대상 상품명 또는 브랜드 <span class="text-rose-500">*</span></label>
                <input type="text" id="cs-report-product" class="cs-field-input" 
                       placeholder="예: [유니클로] 수피마 코튼 크루넥 T" required maxlength="100">
              </div>

              <!-- 3. 상세 제보 내용 -->
              <div>
                <label for="cs-report-details" class="cs-field-label">오류 상세 내용 <span class="text-rose-500">*</span></label>
                <textarea id="cs-report-details" class="cs-field-textarea" rows="4" 
                          placeholder="발견하신 실제 케어라벨 혼용률이나 정정할 내용을 구체적으로 적어주세요.&#10;(예: 공식몰 표기는 면 100%인데 앱에는 폴리 20%로 나와 있습니다.)" 
                          required maxlength="500"></textarea>
                <span class="cs-char-counter"><span id="cs-char-num">0</span> / 500자</span>
              </div>

              <!-- 폼 액션 버튼 2종 -->
              <div class="cs-form-actions pt-1 space-y-2">
                <button type="button" id="cs-report-copy-btn" class="cs-btn-secondary">
                  <i class="fa-regular fa-copy"></i>
                  <span>내용 복사하기 (클립보드 저장)</span>
                </button>
                <button type="button" id="cs-report-email-btn" class="cs-btn-primary">
                  <i class="fa-solid fa-paper-plane"></i>
                  <span>이메일로 제보 발송하기 (mailto:)</span>
                </button>
              </div>

              <div class="cs-report-footnote">
                수신처: <strong>${OFFICIAL_EMAIL}</strong><br>
                이메일 발송 시 내용이 자동 복사되어 전송 오류에 대비합니다.
              </div>
            </form>
          </div>
        </div>

      </div>

      <!-- 플로팅 원형 토글 버튼 (아이콘: 헤드셋/챗봇) -->
      <button type="button" id="cs-floating-btn" class="cs-floating-btn" aria-label="AI CS 어시스턴트 열기" aria-haspopup="dialog" aria-expanded="false">
        <div class="cs-btn-icon-wrapper">
          <i class="fa-solid fa-headset cs-icon-open"></i>
          <i class="fa-solid fa-xmark cs-icon-close"></i>
        </div>
        <!-- 실시간 온라인 표시등 배지 -->
        <span class="cs-btn-live-dot" title="AI 실시간 상담 가능">
          <span class="cs-btn-live-ping"></span>
        </span>
      </button>
    `;
  }

  // -------------------------------------------------------------
  // 마크다운 형태 간단 렌더링 헬퍼 (Bold, Code, Linebreak 지원)
  // -------------------------------------------------------------
  function formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code `...`
    html = html.replace(/`([^`]+)`/g, '<code class="cs-inline-code">$1</code>');
    // Bold **...**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *...*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  // -------------------------------------------------------------
  // 메인 위젯 컨트롤러 클래스
  // -------------------------------------------------------------
  class OtlabelCSWidget {
    constructor() {
      this.isOpen = false;
      this.isResponding = false;
      this.init();
    }

    init() {
      const anchor = document.getElementById('floating-widget-anchor');
      if (!anchor) {
        console.warn('[Otlabel CS] #floating-widget-anchor not found in DOM.');
        return;
      }

      // 중복 주입 방지
      if (document.getElementById('cs-floating-btn')) {
        return;
      }

      anchor.innerHTML = createWidgetHTML();
      this.cacheDOM();
      this.bindEvents();
      this.initTooltip();
      this.setupBottomBarObserver();
    }

    cacheDOM() {
      this.anchor = document.getElementById('floating-widget-anchor');
      this.floatingBtn = document.getElementById('cs-floating-btn');
      this.popup = document.getElementById('cs-chat-popup');
      this.closeBtn = document.getElementById('cs-close-popup-btn');
      this.resetBtn = document.getElementById('cs-reset-chat-btn');
      this.tooltip = document.getElementById('cs-tooltip-bubble');
      this.tooltipCloseBtn = document.getElementById('cs-tooltip-close-btn');

      // 탭 엘리먼트
      this.tabChat = document.getElementById('cs-tab-chat');
      this.tabReport = document.getElementById('cs-tab-report');
      this.contentChat = document.getElementById('cs-tab-content-chat');
      this.contentReport = document.getElementById('cs-tab-content-report');

      // 채팅 엘리먼트
      this.messagesContainer = document.getElementById('cs-messages-container');
      this.chatForm = document.getElementById('cs-chat-form');
      this.chatInput = document.getElementById('cs-chat-input');
      this.sendBtn = document.getElementById('cs-chat-send-btn');

      // 제보 폼 엘리먼트
      this.reportForm = document.getElementById('cs-report-form');
      this.reportType = document.getElementById('cs-report-type');
      this.reportProduct = document.getElementById('cs-report-product');
      this.reportDetails = document.getElementById('cs-report-details');
      this.charNum = document.getElementById('cs-char-num');
      this.reportCopyBtn = document.getElementById('cs-report-copy-btn');
      this.reportEmailBtn = document.getElementById('cs-report-email-btn');
    }

    bindEvents() {
      // 플로팅 버튼 클릭 토글
      if (this.floatingBtn) {
        this.floatingBtn.addEventListener('click', () => this.togglePopup());
      }

      // 닫기 버튼
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.closePopup());
      }

      // 대화 초기화
      if (this.resetBtn) {
        this.resetBtn.addEventListener('click', () => this.resetConversation());
      }

      // 말풍선 툴팁 닫기
      if (this.tooltipCloseBtn) {
        this.tooltipCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dismissTooltip();
        });
      }

      // 탭 전환
      if (this.tabChat) {
        this.tabChat.addEventListener('click', () => this.switchTab('chat'));
      }
      if (this.tabReport) {
        this.tabReport.addEventListener('click', () => this.switchTab('report'));
      }

      // FAQ 버튼 이벤트 위임
      if (this.messagesContainer) {
        this.messagesContainer.addEventListener('click', (e) => {
          const faqBtn = e.target.closest('.cs-faq-btn');
          if (faqBtn) {
            const faqKey = faqBtn.getAttribute('data-faq');
            this.handleFAQClick(faqKey);
            return;
          }

          const actionBtn = e.target.closest('.cs-msg-action-btn');
          if (actionBtn) {
            const action = actionBtn.getAttribute('data-action');
            if (action === 'openReportTab') {
              this.switchTab('report');
            }
          }
        });
      }

      // 추천 키워드 칩 클릭
      const chipsBar = this.popup.querySelector('.cs-keyword-chips-bar');
      if (chipsBar) {
        chipsBar.addEventListener('click', (e) => {
          const chip = e.target.closest('.cs-chip-btn');
          if (chip) {
            const query = chip.getAttribute('data-query');
            if (query) {
              this.handleUserSubmit(query);
            }
          }
        });
      }

      // 채팅 메시지 전송
      if (this.chatForm) {
        this.chatForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.submitChat();
        });
      }

      // 제보 폼 글자수 카운터
      if (this.reportDetails && this.charNum) {
        this.reportDetails.addEventListener('input', () => {
          this.charNum.textContent = this.reportDetails.value.length;
        });
      }

      // 제보 폼 - 내용 복사 버튼
      if (this.reportCopyBtn) {
        this.reportCopyBtn.addEventListener('click', () => this.copyReportContent());
      }

      // 제보 폼 - 이메일 발송 버튼
      if (this.reportEmailBtn) {
        this.reportEmailBtn.addEventListener('click', () => this.sendReportEmail());
      }

      // ESC 키로 팝업 닫기 지원
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closePopup();
        }
      });
    }

    initTooltip() {
      // 세션 스토리지에서 닫힘 여부 체크
      const dismissed = sessionStorage.getItem('otlabel_cs_tooltip_dismissed');
      if (dismissed === 'true' && this.tooltip) {
        this.tooltip.classList.add('hidden');
        return;
      }

      // 6초 후 자동 페이드아웃 (유저 방해 최소화)
      setTimeout(() => {
        if (this.tooltip && !this.tooltip.classList.contains('hidden')) {
          this.dismissTooltip();
        }
      }, 7000);
    }

    dismissTooltip() {
      if (!this.tooltip) return;
      this.tooltip.classList.add('fade-out');
      setTimeout(() => {
        this.tooltip.classList.add('hidden');
      }, 300);
      try {
        sessionStorage.setItem('otlabel_cs_tooltip_dismissed', 'true');
      } catch (err) {
        // Safe storage fallback
      }
    }

    setupBottomBarObserver() {
      if (!this.anchor) return;

      const updatePosition = () => {
        const bottomBar = document.getElementById('compare-bottom-bar') ||
                          document.querySelector('[id*="compare-bottom"]') ||
                          document.querySelector('[id*="compare-tray"]') ||
                          document.querySelector('.compare-tray');

        let isActive = false;
        if (bottomBar) {
          const style = window.getComputedStyle(bottomBar);
          const isHiddenClass = bottomBar.classList.contains('hidden');
          const isDisplayNone = style.display === 'none';
          const isVisibilityHidden = style.visibility === 'hidden';
          const hasHeight = bottomBar.offsetHeight > 0;
          isActive = !isHiddenClass && !isDisplayNone && !isVisibilityHidden && hasHeight;
        }

        if (isActive) {
          this.anchor.classList.add('has-bottom-tray', 'has-bottom-bar');
        } else {
          this.anchor.classList.remove('has-bottom-tray', 'has-bottom-bar');
        }
      };

      // 초기 실행
      updatePosition();

      // MutationObserver로 하단 바 DOM 상태 및 클래스 변화 실시간 감지
      try {
        const observer = new MutationObserver(() => {
          updatePosition();
        });

        observer.observe(document.body, {
          attributes: true,
          subtree: true,
          attributeFilter: ['class', 'style', 'hidden']
        });
      } catch (e) {
        console.warn('[Otlabel CS] MutationObserver setup failed', e);
      }

      window.addEventListener('resize', updatePosition);
    }

    togglePopup() {
      if (this.isOpen) {
        this.closePopup();
      } else {
        this.openPopup();
      }
    }

    openPopup() {
      this.isOpen = true;
      this.dismissTooltip();
      this.popup.classList.remove('hidden');
      this.popup.classList.remove('closing');
      this.floatingBtn.classList.add('active');
      this.floatingBtn.setAttribute('aria-expanded', 'true');

      // 모바일 포커스 인체공학
      setTimeout(() => {
        if (this.chatInput && window.innerWidth > 640) {
          this.chatInput.focus();
        }
        this.scrollToBottom();
      }, 100);
    }

    closePopup() {
      this.isOpen = false;
      this.popup.classList.add('closing');
      this.floatingBtn.classList.remove('active');
      this.floatingBtn.setAttribute('aria-expanded', 'false');

      setTimeout(() => {
        if (!this.isOpen) {
          this.popup.classList.add('hidden');
          this.popup.classList.remove('closing');
        }
      }, 200);
    }

    switchTab(tabName) {
      if (tabName === 'chat') {
        this.tabChat.classList.add('active');
        this.tabReport.classList.remove('active');
        this.contentChat.classList.add('active');
        this.contentReport.classList.remove('active');
        setTimeout(() => this.scrollToBottom(), 50);
      } else if (tabName === 'report') {
        this.tabReport.classList.add('active');
        this.tabChat.classList.remove('active');
        this.contentReport.classList.add('active');
        this.contentChat.classList.remove('active');
        if (this.reportProduct) {
          this.reportProduct.focus();
        }
      }
    }

    resetConversation() {
      if (this.isResponding) return;

      this.messagesContainer.innerHTML = `
        <div class="cs-msg-row cs-msg-bot">
          <div class="cs-msg-avatar">
            <i class="fa-solid fa-tags text-[11px]"></i>
          </div>
          <div class="cs-msg-bubble">
            <p class="cs-msg-text font-medium text-gray-800">
              대화 내용이 초기화되었습니다. 😊<br>
              의류 혼용률이나 원단 정보에 관해 무엇이든 물어보세요!
            </p>
          </div>
        </div>

        <div class="cs-quick-faq-wrapper">
          <p class="cs-faq-label">
            <i class="fa-solid fa-bolt text-indigo-500"></i> 자주 묻는 질문 (FAQ)
          </p>
          <div class="cs-quick-faq-grid">
            <button type="button" class="cs-faq-btn" data-faq="composition">
              <span class="cs-faq-icon">🏷️</span>
              <span class="cs-faq-text">혼용률 보는 법</span>
            </button>
            <button type="button" class="cs-faq-btn" data-faq="price">
              <span class="cs-faq-icon">💰</span>
              <span class="cs-faq-text">가격/재고 차이</span>
            </button>
            <button type="button" class="cs-faq-btn" data-faq="report">
              <span class="cs-faq-icon">📝</span>
              <span class="cs-faq-text">원단 정보 수정/제보</span>
            </button>
            <button type="button" class="cs-faq-btn" data-faq="partnership">
              <span class="cs-faq-icon">🤝</span>
              <span class="cs-faq-text">브랜드 제휴/입점</span>
            </button>
          </div>
        </div>
      `;
      this.showToast('대화가 초기화되었습니다.');
    }

    handleFAQClick(faqKey) {
      if (this.isResponding || !FAQ_DATA[faqKey]) return;

      const item = FAQ_DATA[faqKey];
      this.addUserMessage(item.query);
      this.respondWithBot(item.response, item.actionBtn);
    }

    submitChat() {
      if (this.isResponding) return;
      const text = this.chatInput.value.trim();
      if (!text) return;

      this.chatInput.value = '';
      this.handleUserSubmit(text);
    }

    handleUserSubmit(text) {
      if (this.isResponding) return;
      this.addUserMessage(text);
      const matched = this.matchKeywordResponse(text);
      this.respondWithBot(matched.text, matched.actionBtn);
    }

    matchKeywordResponse(userText) {
      const lower = userText.toLowerCase().replace(/\s+/g, '');

      // 1. FAQ 직접 매칭
      if (lower.includes('혼용률') || lower.includes('비율') || lower.includes('섬유보는법')) {
        return { text: FAQ_DATA.composition.response };
      }
      if (lower.includes('가격차이') || lower.includes('재고차이') || lower.includes('품절')) {
        return { text: FAQ_DATA.price.response };
      }
      if (lower.includes('제휴') || lower.includes('입점') || lower.includes('파트너')) {
        return { text: FAQ_DATA.partnership.response };
      }
      if (lower.includes('오류제보') || lower.includes('수정제보') || lower.includes('제보')) {
        return {
          text: FAQ_DATA.report.response,
          actionBtn: FAQ_DATA.report.actionBtn
        };
      }

      // 2. 키워드 규칙 탐색
      for (const rule of KEYWORD_RULES) {
        const found = rule.keywords.some((kw) => lower.includes(kw.toLowerCase()));
        if (found) {
          return { text: rule.response, actionBtn: rule.actionBtn };
        }
      }

      // 3. Fallback 기본 응답
      return {
        text: `질문해 주신 **"${userText}"**에 대한 안내입니다. 💡

궁금하신 원단 소재(면, 폴리, 울, 린넨, 레이온, 스판 등), 올바른 세탁·건조법, 또는 오류 제보에 대해 키워드를 입력해 주시면 더욱 정확하고 상세한 가이드를 제공해 드릴 수 있습니다.

오류 제보나 비즈니스 입점 문의는 상단의 **[오류 제보/문의]** 탭을 이용해 주시거나 \`${OFFICIAL_EMAIL}\`로 편하게 연락해 주세요!`,
        actionBtn: { text: '✍️ 오류 제보/문의 탭으로 이동', action: 'openReportTab' }
      };
    }

    addUserMessage(text) {
      const row = document.createElement('div');
      row.className = 'cs-msg-row cs-msg-user';
      row.innerHTML = `
        <div class="cs-msg-bubble">
          <p class="cs-msg-text">${escapeHTML(text)}</p>
        </div>
      `;
      this.messagesContainer.appendChild(row);
      this.scrollToBottom();
    }

    respondWithBot(responseText, actionBtn = null) {
      this.isResponding = true;

      // 타이핑 인디케이터 노출
      const typingRow = document.createElement('div');
      typingRow.className = 'cs-msg-row cs-msg-bot cs-typing-row';
      typingRow.innerHTML = `
        <div class="cs-msg-avatar">
          <i class="fa-solid fa-tags text-[11px]"></i>
        </div>
        <div class="cs-msg-bubble cs-typing-bubble">
          <span class="cs-dot"></span>
          <span class="cs-dot"></span>
          <span class="cs-dot"></span>
        </div>
      `;
      this.messagesContainer.appendChild(typingRow);
      this.scrollToBottom();

      // 생생한 인터랙션을 위한 짧은 지연(300~450ms)
      setTimeout(() => {
        if (typingRow.parentNode) {
          typingRow.remove();
        }

        const botRow = document.createElement('div');
        botRow.className = 'cs-msg-row cs-msg-bot';

        let actionBtnHTML = '';
        if (actionBtn) {
          actionBtnHTML = `
            <div class="cs-msg-actions-box">
              <button type="button" class="cs-msg-action-btn" data-action="${actionBtn.action}">
                ${actionBtn.text}
              </button>
            </div>
          `;
        }

        botRow.innerHTML = `
          <div class="cs-msg-avatar">
            <i class="fa-solid fa-tags text-[11px]"></i>
          </div>
          <div class="cs-msg-bubble">
            <div class="cs-msg-text">${formatMarkdown(responseText)}</div>
            ${actionBtnHTML}
          </div>
        `;

        this.messagesContainer.appendChild(botRow);
        this.scrollToBottom();
        this.isResponding = false;
      }, 350);
    }

    scrollToBottom() {
      if (this.messagesContainer) {
        this.messagesContainer.scrollTo({
          top: this.messagesContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }

    // -----------------------------------------------------------
    // 제보/문의 폼 처리 (클립보드 복사 & mailto: 지원)
    // -----------------------------------------------------------
    buildReportPayload() {
      const type = (this.reportType && this.reportType.value) || '라벨 혼용률 오류';
      const product = (this.reportProduct && this.reportProduct.value.trim()) || '';
      const details = (this.reportDetails && this.reportDetails.value.trim()) || '';

      if (!product) {
        this.showToast('⚠️ 대상 상품명을 입력해 주세요.');
        if (this.reportProduct) this.reportProduct.focus();
        return null;
      }
      if (!details) {
        this.showToast('⚠️ 오류 상세 내용을 입력해 주세요.');
        if (this.reportDetails) this.reportDetails.focus();
        return null;
      }

      const now = new Date();
      const timestamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

      // 브라우저 및 디바이스 환경 정보 수집
      const userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || 'Unknown';
      const screenInfo = (typeof window !== 'undefined' && window.innerWidth && window.innerHeight)
        ? `${window.innerWidth}x${window.innerHeight}`
        : 'Unknown';
      const browserInfo = `${userAgent} (화면: ${screenInfo})`;

      const text = `[Otlabel 데이터 수정 및 제보 요청]
----------------------------------------
■ 제보 유형: ${type}
■ 대상 상품명/브랜드: ${product}
■ 상세 내용:
${details}
■ 브라우저/환경: ${browserInfo}
■ 제보 일시: ${timestamp}
----------------------------------------
(Otlabel 구글 스프레드시트 검증 및 데이터베이스 반영 요청)`;

      return { type, product, details, text, timestamp, browserInfo };
    }

    async copyReportContent() {
      const payload = this.buildReportPayload();
      if (!payload) return;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(payload.text);
        } else {
          fallbackCopyText(payload.text);
        }
        this.showToast('📋 제보 내용이 클립보드에 복사되었습니다!');
      } catch (err) {
        fallbackCopyText(payload.text);
        this.showToast('📋 제보 내용이 클립보드에 복사되었습니다.');
      }
    }

    sendReportEmail() {
      const payload = this.buildReportPayload();
      if (!payload) return;

      // 발송 전 클립보드 복사 백업 제공
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(payload.text);
        } else {
          fallbackCopyText(payload.text);
        }
      } catch (err) {
        // Safe copy
      }

      const subject = encodeURIComponent(`[Otlabel 제보] ${payload.type} - ${payload.product}`);
      const body = encodeURIComponent(payload.text);
      const mailtoUrl = `mailto:${OFFICIAL_EMAIL}?subject=${subject}&body=${body}`;

      this.showToast('✉️ 메일 앱을 실행합니다. (내용 자동 복사 완료)');

      // 메일 클라이언트 호출
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 200);
    }

    showToast(message) {
      // index.html의 토스트 재활용 또는 폴백
      const toast = document.getElementById('toast-message');
      if (toast) {
        toast.textContent = message;
        toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
        toast.classList.add('opacity-100', 'translate-y-0');

        setTimeout(() => {
          toast.classList.remove('opacity-100', 'translate-y-0');
          toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
        }, 2500);
      } else {
        alert(message);
      }
    }
  }

  // -------------------------------------------------------------
  // 보조 유틸리티 함수
  // -------------------------------------------------------------
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('execCommand copy fallback failed', e);
    }
    document.body.removeChild(textarea);
  }

  // -------------------------------------------------------------
  // DOM 로드 완료 시 위젯 자동 인스턴스화
  // -------------------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.otlabelCSWidget = new OtlabelCSWidget();
    });
  } else {
    window.otlabelCSWidget = new OtlabelCSWidget();
  }

})();
