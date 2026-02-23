# UI 컴포넌트

## 폴더 구조

| 폴더 | 설명 |
|------|------|
| `layout/` | 공용 레이아웃 컴포넌트 (모든 대시보드 페이지에서 사용) |
| `domain/` | 도메인별 컴포넌트 (특정 기능에 종속) |

## layout/ 파일 목록

| 파일 | 컴포넌트 | 설명 |
|------|---------|------|
| `DashboardShell.tsx` | `DashboardShell` | 3패널 레이아웃 (사이드바 + 메인 + TopBar), 모바일 햄버거 메뉴 |
| `TopBar.tsx` | `TopBar` | 상단 네비게이션 바 (점수, 스트릭, 버전 배지) |
| `Sidebar.tsx` | `Sidebar` | 좌측 파일 목록 (필터 탭, 진행률, 완료 배지) |
| `HotkeyHelp.tsx` | `HotkeyHelp` | 단축키 도움말 오버레이 (O/X/F/Space/Tab/Arrow 등) |
| `UnsavedModal.tsx` | `UnsavedModal` | 미저장 변경 경고 모달 |

## domain/ 폴더 구조

### domain/labeling/

| 파일 | 컴포넌트 | 설명 |
|------|---------|------|
| `WaveformCanvas.tsx` | `WaveformCanvas` | Canvas 기반 파형 렌더링 (주파수/시간 축, 격자선, 그라데이션 배경) |

## 레이아웃 계층

```
DashboardShell
├── TopBar          (상단)
├── Sidebar         (좌측)
├── {children}      (메인 컨텐츠)
├── HotkeyHelp      (오버레이)
└── UnsavedModal    (모달)
```

## 규칙

- **새 레이아웃 컴포넌트** → `layout/`에 배치
- **새 도메인 컴포넌트** → `domain/{도메인명}/`에 배치
- 컴포넌트 파일명: PascalCase (`WaveformCanvas.tsx`)
- 모든 컴포넌트는 `"use client"` 디렉티브 포함 (서버 컴포넌트 제외)
- Tailwind CSS 클래스 사용, 인라인 스타일 최소화
- Lucide React 아이콘 사용 (`lucide-react` 패키지)
