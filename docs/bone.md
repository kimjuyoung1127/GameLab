# App Bone (Implementation Starter)

Last Updated: 2026-02-10 (KST)

## 1. 문서 목적
- 빠르게 동작하는 MVP 뼈대를 구현하기 위한 개발자 가이드
- 상세 설계는 `docs/react.md`, 요구사항은 `docs/Prd.md`를 기준으로 함

## 2. 최소 실행 단계
```bash
npm install
npm run dev
```

## 3. 구현 순서
1. 라우팅 뼈대
- `/login`
- `/`
- `/sessions`
- `/labeling/[id]`
- `/leaderboard`

2. 레이아웃
- Sidebar
- TopBar
- PageWrapper

3. Mock 데이터
- sessions
- audio files
- suggestions

4. annotation-store
- confirm/reject/applyFix
- score/streak 반영

5. 라벨링 3패널
- FileQueuePanel
- SpectrogramPanel
- AISidePanel

## 4. 핵심 동작 규칙
- Confirm: 현재 제안 `confirmed`, 점수 +10, 다음 제안 이동
- Reject: 현재 제안 `rejected`, `edit` 모드 전환
- Apply Fix: 점수 +20, `review` 모드 복귀

## 5. 권장 파일 배치
```txt
src/components/layout/*
src/components/domain/sessions/*
src/components/domain/labeling/*
src/lib/mock/*
src/lib/store/annotation-store.ts
src/app/(dashboard)/*
```

## 6. 품질 체크
- [ ] `npm run build` 성공
- [ ] 세션 생성 -> 라벨링 진입 동작
- [ ] O/X/ApplyFix 점수 변동 확인
- [ ] 빈 제안 상태 처리 확인

## 7. 다음 우선순위
1. hotkeys(O/X/B/E/R, Ctrl+Z)
2. 실제 Canvas 오버레이/드로잉
3. Magnetic Brush v1
4. autosave + offline queue

## 8. SoundLab 기반 즉시 추가할 것
1. Heavy/Light 분석 함수 분리
- Heavy: 파일 단위 분석 결과 캐시
- Light: threshold/sensitivity 변경 즉시 재반영

2. 타임라인/이벤트 로그
- ON/OFF 세그먼트 카드 + 바 차트
- 이벤트 선택 시 해당 timestamp로 플레이헤드 점프

3. 스펙트럼 탐색 모달
- Top Peak 추천
- 추천 주파수 클릭 시 target frequency 즉시 반영

4. 서비스 레이어
- `analysis-service`로 알고리즘 호출 단일화
- 화면 컴포넌트에서 직접 계산 금지
