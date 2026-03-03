# Scaffolding Guide

Last Updated: 2026-02-10 (KST)

## 1. 문서 목적
이 문서는 프로젝트 초기 세팅/부트스트랩 체크리스트 전용이다.
코드 예시는 `docs/bone.md`를 기준으로 한다.

## 2. 신규 프로젝트 생성(필요 시)
```bash
npx create-next-app@latest . --ts --app --eslint
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm i zustand lucide-react
```

## 3. 기존 레포 적용(현재 GameLab 권장)
1. `src/app` 라우트 그룹 존재 확인
2. `src/components/{layout,domain,common,ui}` 생성 확인
3. `src/lib/{store,hooks,mock,api,utils}` 생성 확인
4. 경로 alias(`@/*`) 설정 확인

## 4. 필수 체크리스트
- [ ] `npm run dev` 실행 성공
- [ ] `/`, `/sessions`, `/labeling/[id]` 라우트 접근 가능
- [ ] 상태관리 스토어 최소 3개(session/annotation/score) 준비
- [ ] mock 데이터와 타입 정의 일치
- [ ] ESLint 오류 없음

## 5. 환경 규칙
- 문서 경로는 레포 상대경로만 사용
- 하드코딩 텍스트는 상수/로케일로 분리
- 데모 단계에서도 상태 전이 로그를 남길 것

## 6. 완료 기준
- 프로젝트 최초 실행부터 라벨링 흐름(O/X/Edit/Save)이 한 번 끝까지 동작
- 향후 FastAPI 연결 시 교체 지점(`lib/api`)이 분리되어 있음

## 7. SoundLab 이식 체크리스트
- [ ] `analysis-service` 스켈레톤 생성 (`heavy`, `light`, `metrics`)
- [ ] `SignalTimeline` 컴포넌트 자리 생성
- [ ] `EventLogTable` 컴포넌트 자리 생성
- [ ] `SpectralExplorerModal` 컴포넌트 자리 생성
- [ ] mock 데이터에 `segments`, `events`, `threshold` 필드 추가
