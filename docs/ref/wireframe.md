# Wireframe / UI Design Spec

Last Updated: 2026-02-10 (KST)

## 1. 디자인 방향
- Industrial / Scientific / Minimal / High Contrast
- 다크 테마 기반 스펙트로그램 가독성 우선

## 2. Foundations
### 2.1 Color
- Primary: `#4F7CFF`
- Accent: `#22C55E`
- Danger: `#EF4444`
- Warning: `#F59E0B`
- Canvas BG: `#0B1020`
- Panel BG: `#111827`
- Border: `#1F2937`

### 2.2 Typography
- Title: Inter Bold 24
- Section: Inter Semi 18
- Body: Inter 14
- Small: Inter 12

## 3. Figma 페이지 구조
```txt
00 Foundations
01 Components
02 Pages
03 Responsive
```

## 4. 컴포넌트 와이어프레임
### 4.1 Buttons
- Primary: Confirm
- Danger: Reject
- Secondary: Cancel

### 4.2 AI Suggestion Card
- Label
- Confidence
- Time range
- Status badge

### 4.3 Toolbar
- Brush / Eraser / Box / Undo / Redo / Snap

### 4.4 File List Item
- 파일명
- 처리상태
- 활성 표시

## 5. 페이지 와이어프레임
### 5.1 Login (`Page/Login`)
- Logo
- Email
- Password
- Login button

### 5.2 Dashboard (`Page/Dashboard`)
- Today Score Card
- Files Processed Card
- Start Labeling CTA
- Recent Files

### 5.3 Sessions (`Page/Sessions`)
- Search
- Filter Tabs
- Sessions Table
- Create Session Button

### 5.4 Labeling (`Page/Labeling`) - 핵심
3열 레이아웃:
- File Panel: 280px
- Canvas: Flexible
- AI Panel: 320px

Canvas 영역:
- Spectrogram Canvas
- Toolbar
- Audio Player

AI 패널:
- Suggestion Card
- Confirm/Reject
- Edit Mode Panel

추가 패널/모달(권장):
- Smart Summary Card (Bandwidth/Threshold 요약)
- Event Log Table (이벤트 선택 시 캔버스 포커스)
- Signal Timeline (ON/OFF 세그먼트 바)
- Spectral Explorer Modal (Top Peak 추천 후 주파수 적용)

### 5.5 Session Complete (`Page/Complete`)
- Accuracy
- Score
- Save/Export
- Leaderboard 이동

### 5.6 Leaderboard (`Page/Leaderboard`)
- Rank / User / Today / All-time 테이블

## 6. 반응형 기준
### Tablet (>=1024)
- File Panel: 접기 가능
- AI Panel: 슬라이드 패널

### Mobile (<1024, 후속)
- Step-by-step wizard 플로우

## 7. 디자이너 핸드오프 체크
- [ ] 컴포넌트 상태(기본/hover/active/disabled) 정의
- [ ] spacing scale 정의
- [ ] 컬러 토큰과 컴포넌트 링크
- [ ] 페이지별 프레임 이름 표준화
- [ ] 타임라인/이벤트로그/스펙트럼모달 상호작용 프로토타입 정의
