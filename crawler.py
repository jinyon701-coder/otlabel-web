#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Otlabel SPA 상품 케어라벨 정보 자동 수집기
- 무신사스탠다드, 스파오, 탑텐, 유니클로 인기 상품 크롤링
- Playwright Headless Chromium 기반
- Google Apps Script Webhook 기반 구글 시트 동기화 (중복 URL 스킵)
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

# 기본 수집 대상 인기 상품 URL 목록
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
        "isSponsored": False
    }


def run_crawler():
    """메인 크롤링 파이프라인"""
    logger.info("=== Otlabel SPA 케어라벨 자동 수집기 가동 ===")

    existing_links = get_existing_links()

    # 수집 대상 필터링 (중복 URL 제외)
    pending_urls = [u for u in TARGET_URLS if u not in existing_links]
    logger.info(f"수집 대상 총 {len(TARGET_URLS)}개 중 신규 수집 대상: {len(pending_urls)}개")

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
