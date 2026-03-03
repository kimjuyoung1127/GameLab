# Smart Spectro-Tagging PRD

Version: 1.1  
Last Updated: 2026-02-10 (KST)  
Status: Frontend-First MVP -> AI Integration  
Target: 냉동기 제조사 PoC / 데모

## 1. 제품 개요
### 1.1 한 줄 정의
AI가 먼저 소리 이상 구간을 제안하고, 사용자는 색칠하듯 확인/수정하는 협업형 음향 라벨링 플랫폼.

### 1.2 해결하려는 문제
- 음향 데이터 라벨링 비용과 시간이 큼
- 전문가 의존도가 높아 현장 참여가 어려움
- AI 학습용 고품질 라벨 데이터 생산 속도가 낮음

### 1.3 목표
| 구분 | 목표 |
|---|---|
| 기술 목표 | 스펙트로그램 기반 협업 라벨링 플랫폼 구축 |
| UX 목표 | 비전문가도 빠르게 사용 가능한 라벨링 UX 제공 |
| 데모 목표 | 제조사 대상 기술 시연 완성 |
| 사업 목표 | AI 음향 진단 SaaS 확장 기반 확보 |

## 2. 핵심 컨셉
1. AI Co-Pilot: AI가 이상 구간 선제안
2. O/X 검증 UX: 빠른 승인/거절
3. Magnetic Brush: 대충 칠해도 자동 보정
4. Light Gamification: 점수/스트릭/리더보드

## 3. 사용자/시나리오
### 3.1 주요 사용자
- 음향 분석 담당자
- 현장 엔지니어(비전문가 포함)
- 데모 평가자

### 3.2 사용자 흐름
Login -> Dashboard -> Sessions -> Upload -> AI Analyze -> Confirm/Reject -> Edit/Fix -> Save -> Leaderboard

## 4. 핵심 기능 요구사항
### 4.1 AI 선행 추론
- 입력 음원에서 이상 구간 후보 탐지
- 스펙트로그램 위에 마스크/박스로 후보 표시
- 라벨 후보 + confidence 제공

### 4.2 검증 인터랙션
- Confirm: 점수 +10, 다음 제안으로 이동
- Reject: Edit Mode 진입
- 단축키 O/X 지원(Phase 1.5)

### 4.3 Edit Mode + Magnetic Brush
- Brush/Eraser/Box 툴 제공
- Apply Fix 시 점수 +20
- 자동 보정 v1: threshold + region grow

### 4.4 저장/복구
- autosave(유휴 3초 기준)
- 저장 실패 시 offline queue
- Reject/Apply 후 단기 undo 지원

### 4.5 게이미피케이션
- 세션 점수, 스트릭 표시
- 리더보드(일간/누적 mock -> 실데이터)

## 5. 비기능 요구사항
- 데스크톱 모바일지원
- 화면 전환/핵심 액션 반응 지연 최소화
- 상태 전이 추적 가능(로그/이력)

## 6. 데이터 모델(초안)
- users(id, email, role)
- sessions(id, name, device_type, status)
- audio_files(id, session_id, duration, sample_rate)
- ai_suggestions(id, audio_id, label, confidence, start_time, end_time, freq_low, freq_high, status)
- annotations(id, suggestion_id, source, geometry, label)
- session_scores(id, session_id, confirm_count, fix_count, score, streak)
- action_logs(id, session_id, action, payload, created_at)

## 7. API(초안)
- POST /sessions/create
- GET /sessions
- POST /audio/upload
- POST /ai/analyze-audio
- GET /ai/suggestions/{audioId}
- POST /suggestions/confirm
- POST /suggestions/reject
- POST /annotations/save
- GET /leaderboard

## 8. KPI / 수용 기준
- 온보딩 5분 내 첫 세션 완료율 >= 80%
- 제안 검증 평균 처리시간 <= 3초/건 (데모 기준)
- 세션 중단율 <= 20%
- 저장 실패 후 복구 성공률 >= 95%

## 9. 개발 페이즈
### Phase 1: Frontend-First MVP
- 3패널 워크스페이스
- O/X + Edit + 점수 기본 동작
- Mock 데이터 + JSON/CSV export

### Phase 2: AI 연동
- FastAPI 연동
- AI suggestion 실데이터 표시

### Phase 3: Magnetic Brush 고도화
- 보정 알고리즘 개선
- 정확도/속도 튜닝

### Phase 4: 운영 확장
- 권한/통계/리더보드 실시간화
- PoC -> 운영 전환 준비

## 10. SoundLab 자산 재사용 전략
### 10.1 즉시 재사용(우선)
- Heavy/Light 분석 분리:
  - Heavy: 파일 로드/특징 추출/기초 분석(비용 큰 연산)
  - Light: 임계값 조정/필터링/UI 반영(빠른 재계산)
- 타임라인 세그먼트 집계:
  - ON/OFF 연속 구간을 세그먼트로 묶어 요약 지표(총 가동시간/사이클/평균 지속시간) 제공
- 이벤트 로그 + 선택 하이라이트:
  - 이상 이벤트 테이블 선택 시 차트/캔버스 포커스 이동
- CSV Export:
  - 분석 결과와 이벤트 로그를 세션 단위로 내보내기

### 10.2 Phase 2 연계 재사용
- 주파수 탐색기(PSD 기반 Top Peak 추천) 모달
- 동적 임계값(Otsu 기반) + 민감도 파라미터
- 서비스 레이어 분리:
  - UI에서 직접 알고리즘 호출하지 않고 서비스 계층을 통해 호출

### 10.3 적용 시 주의
- Streamlit UI 패턴은 그대로 복제하지 않고 Next.js 상호작용으로 재설계
- 상태 정의는 GameLab 기준으로 고정:
  - `pending -> confirmed`
  - `pending -> rejected -> corrected`
