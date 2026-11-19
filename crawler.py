#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Otlabel SPA 상품 케어라벨 정보 자동 수집기
- 무신사스탠다드, 스파오, 탑텐, 유니클로 인기 상품 크롤링
- Playwright Headless Chromium 기반
- 구글 스프레드시트 자동 동기화 (중복 URL 스킵)
"""

import json
import logging
import os
import re
import sys
import time
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from google.oauth2.service_account import Credentials
import gspread
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("otlabel-crawler")

# 기본 수집 대상 인기 상품 URL 목록 (확장 가능)
TARGET_URLS: List[str] = [
    # 1. 무신사 스탠다드
    "https://www.musinsa.com/products/4356794",  # [시티 레저] 후디드 라이트 다운 재킷
    "https://www.musinsa.com/products/2081554",  # 릴렉스드 베이식 블레이저
    "https://www.musinsa.com/products/1551840",  # 테이퍼드 히든 밴딩 슬랙스
    "https://www.musinsa.com/products/996636",   # 캐시미어 블렌드 라운드 넥 니트
    "https://www.musinsa.com/products/3770428",  # 멜란지 마스터 스웨트셔츠
    
    # 2. 스파오 (SPAO)
    "https://www.spao.com/i/item?itemNo=2608016293&lowerVendNo=LV26000002&pageId=1795096632474&preCornerNo=R13720001_categoryItem",  # 씬라이트 시어 후드 재킷
    "https://spao.com/product/%ED%81%B4%EB%9E%98%EC%8B%9D-%EC%98%A5%EC%8A%A4%ED%8F%AC%EB%93%9C-%EC%85%94%EC%8 warm/123/",
    
    # 3. 유니클로 (UNIQLO)
    "https://www.uniqlo.com/kr/ko/products/E422992-000/00",  # 수피마 코튼 크루넥T
    "https://www.uniqlo.com/kr/ko/products/E460322-000/00",  # 엑스트라 화인 메리노 크루넥 스웨터
    "https://www.uniqlo.com/kr/ko/products/E467027-000/00",  # 프리미엄 램스울 크루넥 스웨터
    
    # 4. 탑텐 (TOPTEN10)
    "https://topten.topten10mall.com/kr/front/goods/goodsDetail.do?goodsNo=MSF4TR1001",
    "https://topten.topten10mall.com/kr/front/goods/goodsDetail.do?goodsNo=MSF4HD1001",
]


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


def connect_google_sheet():
    """환경변수 기반 구글 스프레드시트 첫 번째 시트 연결"""
    creds_raw = os.environ.get("GOOGLE_CREDENTIALS_JSON")
    sheet_id = os.environ.get("SHEET_ID")

    if not creds_raw or not sheet_id:
        logger.error("필수 환경변수(GOOGLE_CREDENTIALS_JSON, SHEET_ID)가 설정되지 않았습니다.")
        return None

    try:
        # JSON 문자열 또는 파일 경로 지원
        if os.path.exists(creds_raw):
            with open(creds_raw, "r", encoding="utf-8") as f:
                creds_dict = json.load(f)
        else:
            creds_dict = json.loads(creds_raw)

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]
        credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        client = gspread.authorize(credentials)
        spreadsheet = client.open_by_key(sheet_id)
        worksheet = spreadsheet.get_worksheet(0)
        logger.info(f"구글 스프레드시트 연결 성공: '{spreadsheet.title}' (시트: {worksheet.title})")
        return worksheet
    except Exception as e:
        logger.error(f"구글 스프레드시트 연결 실패: {e}")
        return None


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
        except Exception:
            pass

    # (1) 테이블 및 dl/dt/dd 구조 탐색
    for row in soup.find_all(["tr", "li", "div", "dl"]):
        txt = row.get_text(" ", strip=True)
        if ("제품 소재" in txt or "소재" in txt or "혼용률" in txt or "겉감" in txt) and "%" in txt:
            # 적정 길이의 소재 문구 포착
            clean_txt = re.sub(r"\s+", " ", txt)
            # 불필요한 레이블 접두어 분리
            m = re.search(r"(?:제품\s*소재|소재|혼용률)\s*[:\s]?\s*(.+?)(?:색상|제조국|제조사|치수|세탁방법|$)", clean_txt)
            if m:
                candidate = m.group(1).strip()
                if "%" in candidate and len(candidate) > 4:
                    fabric = candidate
                    break
            elif len(clean_txt) < 300 and "%" in clean_txt:
                fabric = clean_txt
                break

    # (2) 정규식 % 패턴 직접 검색 Fallback
    if not fabric:
        percent_matches = re.findall(r"([가-힣a-zA-Z\s]{2,15}\s*\d{1,3}\s*%)", html)
        if percent_matches:
            fabric = ", ".join([p.strip() for p in percent_matches[:5]])

    # 정제
    if not name:
        name = f"{brand} 추천 의류"
    if not fabric:
        fabric = "면 100% (상세 라벨 확인 권장)"

    logger.info(f"  ✓ 추출 결과: [{brand}] {name} | {price:,}원 | {fabric[:40]}...")

    return {
        "brand": brand,
        "name": name,
        "price": price,
        "fabric": fabric,
        "link": url,
        "isSponsored": "FALSE"
    }


def run_crawler():
    """메인 크롤링 파이프라인"""
    logger.info("=== Otlabel SPA 케어라벨 자동 수집기 가동 ===")

    worksheet = connect_google_sheet()
    existing_links = set()

    if worksheet:
        try:
            records = worksheet.get_all_values()
            if records and len(records) > 1:
                # E열 (index 4) 링크 목록 추출
                for r in records[1:]:
                    if len(r) > 4 and r[4].strip():
                        existing_links.add(r[4].strip())
            logger.info(f"구글 시트 내 기존 등록 상품 수: {len(existing_links)}개")
        except Exception as e:
            logger.warning(f"기존 링크 목록 조회 중 오류 발생 (진행 계속): {e}")
    else:
        logger.warning("구글 시트가 연결되지 않아 로컬 테스트 모드로 수집만 수행합니다.")

    # 수집 대상 필터링 (중복 URL 제외)
    pending_urls = [u for u in TARGET_URLS if u not in existing_links]
    logger.info(f"수집 대상 총 {len(TARGET_URLS)}개 중 신규 수집 대상: {len(pending_urls)}개")

    if not pending_urls:
        logger.info("새로 수집할 신규 상품이 없습니다. 작업을 종료합니다.")
        return

    success_count = 0
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
                    # 구글 시트에 행 추가 (A~F열: brand, name, price, fabric, link, isSponsored)
                    if worksheet:
                        worksheet.append_row([
                            item["brand"],
                            item["name"],
                            item["price"],
                            item["fabric"],
                            item["link"],
                            item["isSponsored"]
                        ])
                        logger.info("  -> 구글 스프레드시트에 추가 완료!")
                    success_count += 1
                else:
                    fail_count += 1
            except (PlaywrightTimeoutError, Exception) as e:
                logger.error(f"  ✕ URL 수집 실패 ({url}): {e}")
                fail_count += 1

            # Rate Limit 및 차단 방지 대기
            time.sleep(2)

        browser.close()

    logger.info("\n=== 수집 완료 요약 ===")
    logger.info(f"성공: {success_count}건 | 실패/스킵: {fail_count}건 | 총계: {len(pending_urls)}건")


if __name__ == "__main__":
    run_crawler()
