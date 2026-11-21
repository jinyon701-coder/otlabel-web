#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Otlabel SPA 상품 케어라벨 정보 수집기
[법률 자문 P0 조치: 브랜드별 이용약관 및 자동 접근권한 사전 확인 전까지 대량 자동 수집 보류]
- 본 스크립트는 운영자 수동 승인 및 사내 검증 목적으로만 제한적으로 실행됩니다.
- 운영자가 직접 공식 스토어 표기치를 검증하고 checkedDate(확인일)를 기록한 데이터를 표준으로 채택합니다.
- 무단 대량 수집 방지를 위한 실행 가드가 기본 적용되어 있습니다.
"""

import csv
import io
import json
import logging
import os
import re
import sys
import time
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import requests

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("otlabel-crawler")

# Google Apps Script 웹앱 및 시트 CSV URL 설정
WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzsBa5RxgQ9MxM1Ln-FM0VHGepdhfefwBF2izQELQKCV8MHwJMw27pwHQ1V7EKuO-mfgQ/exec"
SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1TohouE0HOPXrsH-k5A55Twv3lqsc7bHIH7m74SWRJZ8/export?format=csv"
FALLBACK_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-_JrM639eTC06eeehdde2pEcvGo4cuxFGNdoIEXgFJjA0Ba5B_4S3FTMmhRympEOmcTojaqn5LOWP/pub?output=csv"

# 기본 수집 대상 인기 상품 URL 목록 (검증된 대표 스테디셀러 URL)
TARGET_URLS: List[str] = [
    # 1. 무신사 스탠다드 (Musinsa Standard)
    "https://www.musinsa.com/products/4356794",  # [시티 레저] 후디드 라이트 다운 재킷
    "https://www.musinsa.com/products/2081554",  # 릴렉스드 베이식 블레이저
    "https://www.musinsa.com/products/1551840",  # 테이퍼드 히든 밴딩 슬랙스
    "https://www.musinsa.com/products/996636",   # 캐시미어 블렌드 라운드 넥 니트
    "https://www.musinsa.com/products/3770428",  # 멜란지 마스터 스웨트셔츠
    
    # 2. 스파오 (SPAO) - 최신 유효 스테디셀러 URL
    "https://www.spao.com/i/item?itemNo=2608016293&lowerVendNo=LV26000002&pageId=1795096632474&preCornerNo=R13720001_categoryItem",  # [씬라이트] 여성 시어 후드 재킷
    "https://spao.com/product/%ED%81%B4%EB%9E%98%EC%8B%9D-%EC%98%A5%EC%8A%A4%ED%8F%AC%EB%93%9C-%EC%85%94%EC%8A%B8/4735/",  # 클래식 옥스포드 셔츠
    "https://spao.com/product/%EB%B2%A0%EC%9D%B4%EC%8B%9D-%ED%91%B8%ED%8D%BC-%ED%8C%A8%EB%94%A9/5820/",  # 베이직 푸퍼 패딩
    
    # 3. 유니클로 (UNIQLO) - 대표 스테디셀러 라인업
    "https://www.uniqlo.com/kr/ko/products/E422992-000/00",  # 수피마 코튼 크루넥T
    "https://www.uniqlo.com/kr/ko/products/E460322-000/00",  # 엑스트라 화인 메리노 크루넥 스웨터
    "https://www.uniqlo.com/kr/ko/products/E467027-000/00",  # 프리미엄 램스울 크루넥 스웨터
    "https://www.uniqlo.com/kr/ko/products/E450251-000/00",  # 히트텍 크루넥T (9부)
    "https://www.uniqlo.com/kr/ko/products/E462372-000/00",  # 스마트 앵클 팬츠
    
    # 4. 탑텐 (TOPTEN10) - 대표 스테디셀러 라인업
    "https://topten.topten10mall.com/kr/front/goods/goodsDetail.do?goodsNo=MSF4TR1001",  # 쿨에어 코튼 크루넥 반팔티
    "https://topten.topten10mall.com/kr/front/goods/goodsDetail.do?goodsNo=MSF4HD1001",  # 헤비웨이트 후드 집업
    "https://topten.topten10mall.com/kr/front/goods/goodsDetail.do?goodsNo=MSD4PP1001",  # 베이직 테이퍼드 슬랙스
]


# 대표 섬유 키워드 (혼용률 텍스트 검증용)
FIBER_KEYWORDS_RE = re.compile(
    r"면|코튼|cotton|울|모|양모|wool|캐시미어|cashmere|폴리에스터|폴리|polyester|"
    r"나일론|nylon|폴리우레탄|스판|spandex|모달|modal|텐셀|tencel|레이온|rayon|"
    r"아크릴|acrylic|린넨|리넨|linen|마|실크|silk|다운|down|솜털|깃털|구스|덕|거위|오리|가죽|leather",
    re.IGNORECASE
)


def sanitize_url(raw_url: str) -> str:
    """공백 제거나 비정상 인코딩 방어 정리"""
    if not raw_url:
        return ""
    return raw_url.strip().replace(" ", "%20")


def determine_brand(url: str, title: str = "") -> str:
    """URL 및 타이틀을 분석하여 브랜드 표준명 반환"""
    url_lower = url.lower()
    title_lower = title.lower()

    if "musinsa.com" in url_lower or "무신사" in title_lower:
        return "무신사스탠다드"
    elif "spao.com" in url_lower or "스파오" in title_lower:
        return "스파오"
    elif "uniqlo.com" in url_lower or "유니클로" in title_lower:
        return "유니클로"
    elif "topten" in url_lower or "탑텐" in title_lower:
        return "탑텐"
    elif "zara.com" in url_lower or "zara" in title_lower:
        return "ZARA"
    elif "hm.com" in url_lower or "h&m" in title_lower:
        return "H&M"
    return "기타"


def get_existing_links() -> set:
    """공개 구글 시트 CSV export URL에서 기존 등록된 상품 link(E열) 목록을 조회하여 중복 방지"""
    existing_links = set()
    csv_urls = [SHEET_CSV_URL, FALLBACK_CSV_URL]

    for url in csv_urls:
        try:
            logger.info(f"구글 시트 CSV 조회 시도: {url}")
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            if resp.status_code == 200 and resp.text.strip():
                reader = csv.reader(io.StringIO(resp.text))
                header = next(reader, None)
                link_col_idx = 4  # 기본 E열 (0-based: 4)
                if header:
                    for idx, col in enumerate(header):
                        if col.strip().lower() == "link":
                            link_col_idx = idx
                            break
                for row in reader:
                    if len(row) > link_col_idx and row[link_col_idx].strip():
                        existing_links.add(row[link_col_idx].strip())
                logger.info(f"기존 등록 상품 조회 완료: 총 {len(existing_links)}개 링크 확인")
                return existing_links
            else:
                logger.warning(f"CSV 조회 응답 코드 비정상: HTTP {resp.status_code}")
        except Exception as e:
            logger.warning(f"CSV 조회 중 오류 발생 ({url}): {e}")

    logger.warning("기존 등록 링크를 가져오지 못했습니다. 중복 검사 없이 계속 진행합니다.")
    return existing_links


def send_to_webhook(items: List[Dict[str, any]]) -> bool:
    """수집된 유효 상품 리스트를 Google Apps Script 웹앱으로 JSON 전송"""
    if not items:
        logger.info("전송할 상품 데이터가 없습니다.")
        return True

    logger.info(f"Google Apps Script 웹앱으로 {len(items)}건의 상품 데이터 전송 시작...")
    try:
        response = requests.post(
            WEBHOOK_URL,
            json=items,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if response.status_code == 200:
            logger.info(f"✓ 웹앱 전송 성공! (응답: {response.text.strip()[:100]})")
            return True
        else:
            logger.error(f"✕ 웹앱 전송 실패 (HTTP {response.status_code}): {response.text[:200]}")
            return False
    except Exception as e:
        logger.error(f"✕ 웹앱 전송 중 네트워크/요청 오류 발생: {e}")
        return False


def extract_price(raw_text: str) -> int:
    """텍스트에서 순수 숫자 가격만 추출"""
    digits = re.sub(r"[^\d]", "", raw_text)
    return int(digits) if digits else 0


def parse_product_page(page, url: str) -> Optional[Dict[str, any]]:
    """Playwright Page 객체를 이용해 상품 스펙 크롤링"""
    brand = determine_brand(url)
    logger.info(f"[{brand}] 페이지 탐색 시작: {url}")

    # 페이지 이동 (타임아웃 35초)
    response = page.goto(url, wait_until="domcontentloaded", timeout=35000)
    page.wait_for_timeout(2000)

    html = page.content()
    soup = BeautifulSoup(html, "html.parser")

    # 1. 상품명 (name) 추출
    name = ""
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        raw_name = og_title.get("content").strip()
        # [브랜드명] 접두사 또는 접미사 정리
        name = re.sub(r"^\s*\[[^\]]+\]\s*", "", raw_name)
        name = name.split(" - ")[0].split(" | ")[0].strip()
        if not name:
            name = raw_name

    if not name:
        h1 = soup.find("h1")
        if h1:
            name = h1.get_text(strip=True)

    # 2. 가격 (price) 추출
    price = 0
    og_price = soup.find("meta", property="product:sale_price:amount") or soup.find("meta", property="og:price:amount")
    if og_price and og_price.get("content"):
        price = extract_price(og_price.get("content"))

    # JSON-LD 지원
    for s in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(s.string or "")
            # 단일 Product 또는 Graph 형태
            items = data if isinstance(data, list) else data.get("@graph", [data])
            for item in items:
                if item.get("@type") == "Product":
                    if not name and item.get("name"):
                        name = item.get("name")
                    offers = item.get("offers", {})
                    if isinstance(offers, dict) and offers.get("price") and price == 0:
                        price = extract_price(str(offers.get("price")))
        except Exception:
            pass

    # DOM 텍스트에서 가격 fallback
    if price == 0:
        price_patterns = [
            r"([0-9]{1,3}(?:,[0-9]{3})+)\s*원",
            r"판매가\s*([0-9]{1,3}(?:,[0-9]{3})+)",
            r"할인가\s*([0-9]{1,3}(?:,[0-9]{3})+)"
        ]
        for pat in price_patterns:
            m = re.search(pat, html)
            if m:
                price = extract_price(m.group(1))
                if price > 1000:
                    break

    # 3. 케어라벨 혼용률 (fabric) 추출
    fabric = ""

    # 무신사 아코디언 버튼 처리
    if "musinsa.com" in url:
        try:
            accordion_btn = page.get_by_role("button", name=re.compile(r"상품\s*고시\s*정보안내|제품\s*소재")).first
            if accordion_btn.is_visible(timeout=3000):
                accordion_btn.click(force=True)
                page.wait_for_timeout(1000)
                html = page.content()
                soup = BeautifulSoup(html, "html.parser")
        except Exception as e:
            logger.debug(f"무신사 아코디언 토글 생략: {e}")

    # 유니클로 상품 파싱 로직 정밀화: 소재/취급 아코디언 펼침 및 전용 파서 적용
    if "uniqlo.com" in url or brand == "유니클로":
        try:
            # 1. 유니클로 소재/취급 아코디언 버튼 탐색 및 클릭
            uniqlo_btn = page.locator("button, a, summary, [role='button'], dt").filter(
                has_text=re.compile(r"소재\s*/?\s*취급|소재\s*정보|사양|소재|Care")
            ).first
            if uniqlo_btn.is_visible(timeout=2500):
                uniqlo_btn.click(force=True)
                page.wait_for_timeout(800)
                html = page.content()
                soup = BeautifulSoup(html, "html.parser")
        except Exception as e:
            logger.debug(f"유니클로 아코디언 클릭 시도 생략: {e}")

        # 2. [소재] 태그 우선 포착 (일반 마케팅 설명문 배제)
        # 예: [소재] [00 WHITE, 09 BLACK] 100% 면 [취급] 세탁기
        m_uniqlo = re.search(r"\[소재\]\s*([^\[\n\r]+?)(?=\s*\[(?:취급|세탁|제조국|원산국)|$)", html)
        if m_uniqlo:
            cand = m_uniqlo.group(1).strip()
            if "%" in cand and FIBER_KEYWORDS_RE.search(cand):
                fabric = re.sub(r"\s+", " ", cand)
                logger.info(f"  [유니클로] [소재] 태그 정밀 포착 성공: {fabric}")

        # 3. [소재/취급] 블록 내 텍스트 정밀 탐색
        if not fabric:
            for el in soup.find_all(["dd", "div", "p", "li"]):
                txt = el.get_text(" ", strip=True)
                if ("[소재]" in txt or "소재/취급" in txt or "소재 :" in txt) and "%" in txt:
                    sub = txt
                    if "[소재]" in sub:
                        sub = sub.split("[소재]")[-1]
                    if "[취급]" in sub:
                        sub = sub.split("[취급]")[0]
                    clean_sub = re.sub(r"\s+", " ", sub).strip()
                    if "%" in clean_sub and FIBER_KEYWORDS_RE.search(clean_sub) and len(clean_sub) < 250:
                        fabric = clean_sub
                        logger.info(f"  [유니클로] 소재/취급 블록 정밀 포착 성공: {fabric}")
                        break

    # (1) 일반 테이블 및 dl/dt/dd 구조 탐색 (무신사, 스파오, 탑텐 등)
    if not fabric:
        for row in soup.find_all(["tr", "li", "div", "dl"]):
            txt = row.get_text(" ", strip=True)
            if ("제품 소재" in txt or "소재" in txt or "혼용률" in txt or "겉감" in txt) and "%" in txt:
                clean_txt = re.sub(r"\s+", " ", txt)
                m = re.search(r"(?:제품\s*소재|소재|혼용률)\s*[:\s]?\s*(.+?)(?:색상|제조국|제조사|치수|세탁방법|$)", clean_txt)
                if m:
                    candidate = m.group(1).strip()
                    if "%" in candidate and FIBER_KEYWORDS_RE.search(candidate) and len(candidate) > 4:
                        fabric = candidate
                        break
                elif len(clean_txt) < 300 and "%" in clean_txt and FIBER_KEYWORDS_RE.search(clean_txt):
                    fabric = clean_txt
                    break

    # (2) 정규식 % 패턴 직접 검색 Fallback (섬유 키워드 매칭 보장)
    if not fabric:
        percent_matches = re.findall(r"([가-힣a-zA-Z\s]{2,15}\s*\d{1,3}\s*%)", html)
        valid_matches = [p.strip() for p in percent_matches if FIBER_KEYWORDS_RE.search(p)]
        if valid_matches:
            fabric = ", ".join(valid_matches[:5])

    invalid_keywords = ["blocked", "bad request", "server error", "찾을 수 없음", "추천 의류"]
    if not name or any(k in name.lower() for k in invalid_keywords) or price <= 0:
        logger.warning(f"  ✕ 유효하지 않은 페이지/차단으로 스킵: [{brand}] {name} ({price}원)")
        return None

    if not fabric:
        fabric = "상세 라벨 확인 권장"

    logger.info(f"  ✓ 추출 성공: [{brand}] {name} | {price:,}원 | {fabric[:40]}...")

    return {
        "brand": brand,
        "name": name,
        "price": price,
        "fabric": fabric,
        "link": url,
        "isSponsored": False,
        "checkedDate": time.strftime("%Y-%m-%d")
    }


def run_crawler():
    """메인 크롤링 파이프라인 (법률 자문 P0 안전 가드 포함)"""
    logger.info("=== Otlabel SPA 케어라벨 정보 수집기 가동 ===")

    # [법률 자문 P0 조치] 자동 대량 크롤링 방지 가드
    allow_crawl = os.environ.get("ALLOW_MANUAL_CRAWL", "").strip().lower() in ("true", "1", "yes")
    if not allow_crawl and "--force" not in sys.argv:
        logger.warning("=" * 68)
        logger.warning(" [법률 자문 P0 조치] 브랜드별 이용약관 및 자동 접근권한 사전 확인 전까지")
        logger.warning(" 무단 대량 자동 크롤링이 안전하게 기본 보류(일시 중지)되어 있습니다.")
        logger.warning(" 운영자 수동 검증 목적으로 단발 실행하시려면:")
        logger.warning("   환경변수: ALLOW_MANUAL_CRAWL=true")
        logger.warning("   또는 명령행 옵션: python crawler.py --force")
        logger.warning(" 로 명시적 승인 후 실행해 주시기 바랍니다.")
        logger.warning("=" * 68)
        return

    existing_links = get_existing_links()

    # 수집 대상 필터링 (URL 정제 및 중복 URL 제외)
    sanitized_targets = [sanitize_url(u) for u in TARGET_URLS if sanitize_url(u)]
    pending_urls = [u for u in sanitized_targets if u not in existing_links]
    logger.info(f"수집 대상 총 {len(sanitized_targets)}개 중 신규 수집 대상: {len(pending_urls)}개")

    if not pending_urls:
        logger.info("새로 수집할 신규 상품이 없습니다. 작업을 종료합니다.")
        return

    collected_items: List[Dict[str, any]] = []
    fail_count = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="ko-KR"
        )
        page = context.new_page()

        for idx, url in enumerate(pending_urls, start=1):
            logger.info(f"\n[{idx}/{len(pending_urls)}] 수집 진행 중...")
            try:
                item = parse_product_page(page, url)
                if item:
                    collected_items.append(item)
                else:
                    fail_count += 1
            except (PlaywrightTimeoutError, Exception) as e:
                logger.error(f"  ✕ URL 수집 실패 ({url}): {e}")
                fail_count += 1

            # Rate Limit 및 차단 방지 대기
            time.sleep(2)

        browser.close()

    logger.info("\n=== 크롤링 완료 요약 ===")
    logger.info(f"유효 수집 성공: {len(collected_items)}건 | 실패/스킵: {fail_count}건 | 대상: {len(pending_urls)}건")

    if collected_items:
        send_to_webhook(collected_items)


if __name__ == "__main__":
    run_crawler()
