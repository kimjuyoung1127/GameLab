# 커스텀 React 훅

## 훅 목록

| 파일 | 훅 이름 | 시그니처 |
|------|---------|---------|
| `use-autosave.ts` | `useAutosave` | `useAutosave(audioId)` |
| `use-waveform.ts` | `useWaveform` | `useWaveform(audioUrl, fallbackDuration)` |
| `use-audio-player.ts` | `useAudioPlayer` | `useAudioPlayer(audioUrl, fallbackDuration)` |

## 각 훅 상세

### useAutosave(audioId)

오프라인/자동 저장 관리 훅:

| 기능 | 설명 |
|------|------|
| 자동 저장 | 30초 간격 + `beforeunload` 시 localStorage 저장 |
| 키 분리 | 파일별 키 `sst-autosave-{audioId}` |
| 레거시 마이그레이션 | 구버전 키 형식 자동 변환 |
| 오프라인 큐 | `getOfflineQueue()`, `enqueueOfflineAction()`, `clearOfflineQueue()` |

### useWaveform(audioUrl, fallbackDuration)

파형 데이터 생성 훅:

| 기능 | 설명 |
|------|------|
| 디코딩 | `AudioContext`로 오디오 디코딩 |
| 다운샘플링 | 1024 포인트로 다운샘플링 |
| 폴백 | URL 없으면 합성 피크(synthetic peaks) 생성 |
| 클린업 | `AbortController`로 요청 취소 처리 |

### useAudioPlayer(audioUrl, fallbackDuration)

오디오 재생 제어 훅:

| 기능 | 설명 |
|------|------|
| 재생/정지/탐색 | `HTMLAudioElement` 기반 |
| 구간 재생 | `playRegion(start, end)` — 선택 영역만 재생 |
| 시뮬레이션 | URL 없으면 `requestAnimationFrame`으로 재생 시뮬레이션 |

## 규칙

- 모든 훅은 **`"use client"` 디렉티브 필수**
- 브라우저 API (`AudioContext`, `HTMLAudioElement`) 사용 시 SSR 가드 필요
- 새 훅 추가 시 이 폴더에 `use-{기능명}.ts` 형태로 생성
