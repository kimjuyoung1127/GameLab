스마트 스펙트로-태깅: 구현 가능성 평가

“AI가 밑그림을 그리고, 사람은 색칠 공부하듯 확인하는” 스마트 스펙트로-태깅 개념은 기술적으로 충분히 실현 가능합니다. 기존 SoundLab 프로젝트의 기반(스트림릿 + Plotly 및 신호 처리 엔진)을 활용하면 핵심 기능을 개발할 수 있으며, 필요에 따라 더 인터랙티브한 스택으로 확장도 고려할 수 있습니다. 아래에서는 제안된 UX 단계별 구현 가능성과 적합한 기술 스택 및 우선순위를 정리합니다.

핵심 기능 및 UX 단계의 실현 가능성

1. AI 선행 추론 (Co-Pilot) – 소리 데이터 입력 시 AI가 이상 구간을 자동으로 찾아 스펙트로그램 위에 반투명 마스크로 표시하고 예상 라벨을 제안하는 기능은 충분히 구현 가능합니다. 이미 SoundLab에서는 Otsu 알고리즘 기반 자동 임계값 계산으로 배경 노이즈 대비 이상 신호 구간을 식별하는 로직이 구현되어 있습니다. 이를 활용하면 특정 구간의 에너지 이상치 여부를 모델이 먼저 판단할 수 있습니다. 스펙트로그램(시간-x축, 주파수-y축) 위에 해당 구간을 하이라이트하여 표시하는 것은 Plotly 등의 시각화 도구로 구현 가능합니다. 예를 들어, Plotly에서는 add_shape() 등을 통해 그래프 영역에 반투명 직사각형을 그릴 수 있고, 데이터 좌표에 맞춰 위치시키는 기능을 지원합니다. SoundLab에서도 Plotly 기반으로 스펙트럼/타임라인 상의 이상 구간을 클릭하면 동기화하는 등의 인터랙티브 기능을 이미 구현한 바 있습니다. 따라서 AI 모델의 출력(예: “0.8초~1.0초 구간, 80% 확률 베어링 마모”)을 스펙트로그램에 바로 시각화하여 사용자가 첫 화면에서 결과를 보도록 만드는 것은 가능하며, 기술적으로도 어렵지 않습니다. 실제 구현 시에는 처음엔 실제 AI모델 대신 미리 준비된 더미 결과를 사용해 흐름을 시연하고, 이후에 모델 연동을 고려하는 전략이 효율적입니다.

 

그림 1: 스펙트로그램 위에 AI가 감지한 이상 구간을 반투명 마스크로 하이라이트한 예시 (예: 0.8~1.0초 사이 100Hz 부근에 이상 신호 영역 표시)

 

2. 직관적 검증 (“Tinder” 스타일 UI) – AI 제안에 대한 빠른 확인 인터페이스도 구현할 수 있습니다. 데스크톱 웹 환경에서는 “O/✔” 승인 또는 “X/✖” 거부 버튼을 제공하고, 키보드 혹은 버튼 클릭으로 즉시 해당 라벨을 확정하거나 수정 모드로 진입하게 할 수 있습니다. 모바일이나 태블릿 환경까지 고려한다면, 스와이프 제스처 라이브러리를 통해 카드 형태의 인터페이스를 구성할 수 있습니다. 예를 들어 오른쪽 스와이프 = 이상 감지 확인, 왼쪽 스와이프 = 오탐지로 표시 같은 동작을 자바스크립트 터치 이벤트로 처리할 수 있습니다. 스트림릿 자체는 기본적으로 스와이프 제스처를 지원하지 않지만, React 기반 Frontend를 사용하거나 모바일 앱으로 제작하면 이러한 제스처도 활용 가능합니다. 하지만 핵심은 O/X를 통한 즉각적 피드백 루프이므로, 초기 구현은 단순 버튼 UX로도 충분합니다. 사용자는 AI가 제안한 라벨이 맞는지 한 번 클릭으로 “맞다/아니다”를 결정하고, 아니다를 선택하면 다음 단계로 자연스럽게 넘어가도록 플로우를 만들 수 있습니다. 이러한 신속 검증 UI는 사용자의 부담을 낮추고, 마치 퀴즈나 카드 게임을 하듯 흥미를 줄 수 있어 채택하기에 좋습니다 (피드백에서도 OX 퀴즈 방식이 재미 요소로 언급되었음).

 

3. 스마트 컬러링 (마그네틱 브러시를 통한 편집) – AI의 예측이 틀리거나 놓친 부분을 사용자가 직접 색칠하듯 수정하는 기능 역시 구현 가능하며, 기술적으로 이 프로젝트의 차별점이 될 부분입니다. 일반적인 그림판처럼 픽셀 단위로 정밀하게 지정하는 대신, 대략적인 영역을 그리면 시스템이 알아서 정확한 경계에 맞춰 보정하는 아이디어입니다. 이는 이미지 처리의 스니핑 툴 혹은 마그네틱 올가미(Magnetic Lasso)와 유사한 개념으로 볼 수 있습니다. 스펙트로그램은 2D 이미지이므로, 사용자가 대충 그린 경로 주변의 음향 에너지 밀집 영역을 자동 인식하여 영역을 조정할 수 있습니다. 예를 들어 사용자가 스펙트로그램의 특정 부분을 형광펜 칠하듯 드래그하면, 그 근처에서 실제 스펙트럼 세기가 높은 픽셀들을 감지해 영역을 채우는 알고리즘을 적용할 수 있습니다. 구현 방식으로는, 그려진 마스크 영역의 경계 주변에 대해 임계값 기반 분할이나 Region Growing 알고리즘을 사용해 밝은 부분을 포착하는 방법이 있습니다. 다행히 이러한 자유 곡선 드로잉 입력을 웹에서 받는 기술은 마련되어 있습니다. 예를 들어 스트림릿에도 Fabric.js 기반의 streamlit-drawable-canvas 컴포넌트가 있어, 이미지 위에 자유롭게 그리기, 박스 그리기 등을 지원하고 그 결과를 파이썬으로 넘겨줄 수 있습니다. 이 컴포넌트를 사용하면 스펙트로그램을 배경 이미지로 놓고 사용자의 낙서(doodle)를 캡처한 뒤, Python OpenCV나 NumPy로 가장 인접한 강한 신호 영역에 붙이는 후처리를 할 수 있을 것입니다. 실제 사례로, SpectroDraw라는 웹앱에서도 브러시, 직사각형 툴 등으로 스펙트로그램 위에 직접 그려서 오디오를 편집하는 기능을 제공하고 있을 정도로, 주파수-시간 영역에서의 마스킹/페인팅 기술은 충분히 입증되어 있습니다. 그러므로 “마그네틱 브러쉬” 아이디어도 구현 난도가 조금 있을 뿐 불가능하지 않으며, 오히려 성공 시 경쟁력 있는 UX가 될 것입니다. 초기 버전에서는 일단 사용자가 손으로 영역을 지정할 수 있게 하고 (예: 반투명 색칠), 이후에 그 영역을 보정하는 알고리즘을 추가하는 형태로 두 단계에 걸쳐 개발하는 것이 좋습니다.

 

4. 라이트 게이미피케이션 (점수 & 랭킹) – 작업량과 정확도에 따른 점수 부여와 랭킹 표시는 비교적 간단한 기능입니다. 사용자가 AI 제안을 얼마나 맞게/틀리게 분류했는지, 놓친 이상을 얼마나 발견했는지 등의 지표를 산정하여 점수화하면 되고, 이를 UI 일부분에 실시간 업데이트 하면 됩니다. 만약 복수 사용자의 경쟁을 실시간으로 보여주려면 백엔드에 점수 데이터를 모아두는 저장소(DB나 실시간 서버)가 필요하지만, 단순 데모 단계에서는 로컬에서 가상 점수와 등수 목록을 보여주는 것으로도 충분합니다. 예를 들어, 한 세션 내에서 정답 1건당 +10점, 오탐 교정 -5점 등의 규칙을 정해 누적 점수를 계산하고, 그 점수를 기준으로 “금일 랭킹”처럼 몇 명의 가상 사용자 프로필과 함께 순위를 시각화할 수 있습니다. 스트림릿에서는 상태값을 통해 세션 점수를 추적하거나, 혹은 간단히 매 반복 시 점수를 다시 그려주면 되고 구현이 어렵지 않습니다. 피드백에서 언급된 것처럼 이 부분은 가볍게 적용하여 사용자가 지루함을 느끼지 않도록 하는 것이 목적이므로, UI에 작은 리더보드나 배지(badge)를 표시하는 정도로도 충분합니다. 기술적으로도 복잡한 로직은 필요 없으며, 추후 확장 시에만 서버 연동을 고민하면 될 것입니다.

기술 스택 검토 및 개발 우선순위

기존 SoundLab에서는 프론트엔드로 Streamlit과 Plotly를 사용하여 빠르게 대시보드형 UI를 구축했고, 백엔드 엔진은 Python (NumPy/SciPy, Numba 가속)으로 구현되었습니다. 이 선택은 연구용 도구로서 빠른 개발에 적합했고, 실제로 대용량 신호를 처리하고 시각화하는 핵심 기능들을 단시간에 구축해냈습니다. 스마트 스펙트로-태깅 MVP 역시 처음에는 이 기존 스택을 활용하는 것이 유리합니다. Streamlit은 간편히 웹 앱을 만들 수 있고, Plotly를 통해 고성능 인터랙티브 차트(WebGL 기반)를 구현할 수 있어 대화형 스펙트로그램 UI도 비교적 수월하게 만들 수 있습니다. 특히 SoundLab에 이미 스펙트럼 분석 및 이상 탐지를 위한 핵심 로직(Goertzel 주파수 필터, Otsu 자동 임계, V5.7 스마트 분석 등)이 구현되어 있으므로, 이를 백엔드 분석 모듈로 재사용하면 AI 추론 부분의 토대를 바로 쓸 수 있습니다. 예를 들어, SoundLab의 Adaptive Thresholding(Otsu) 기능은 추가 학습 없이도 주파수 대역의 이상 여부를 자동으로 판정해주기 때문에, 스마트 태깅의 AI 밑그림 단계에 활용 가능하고 이미 검증된 기법입니다.

 

다만, 사용자와의 실시간 상호작용(스와이프 제스처, 자유 곡면 드로잉 등) 측면에서 Streamlit 단독으로는 한계가 있을 수 있습니다. Streamlit은 주로 버튼/슬라이더 위주의 정적인 대시보드에 가깝기 때문에, 캔버스에 그리기나 제스처 인식 같은 기능은 기본 제공되지 않습니다. 다행히 앞서 언급한 **스트림릿 커스텀 컴포넌트(streamlit-drawable-canvas)**를 활용하면 브러시 드로잉은 해결할 수 있고, O/X 검증은 버튼으로 대체 가능하므로 Streamlit 환경 내에서도 큰 문제 없이 구현은 가능합니다. 속도 면에서도 SoundLab에서 대용량 파일 처리를 위해 Numba 최적화와 메모리 맵 기법 등을 활용한 경험이 있어, 이런 최적화를 신경쓰면 스트림릿 기반이어도 충분히 쾌적한 동작을 얻을 수 있습니다.

 

그러나, 장기적으로 현장 냉동기 기사 등의 모바일 사용 시나리오를 고려하면 웹 프론트엔드/모바일 앱으로 전환을 검토하는 것이 좋습니다. 예컨대 React나 Vue로 커스텀 웹 UI를 만들고, Python으로 만든 AI분석 백엔드를 **REST API(FastAPI 등)**로 분리하면, UI 제어 자유도가 높아집니다. 이렇게 하면 터치 스와이프나 부드러운 드로잉 UX, 오프라인 사용, 기기 센서 접근 등의 요구사항에 더 잘 대응할 수 있습니다. 실제 SpectroDraw의 사례를 보면, 처음에는 웹앱으로 출발하여 나중에 VST 플러그인, iOS 앱으로 확대하는 전략을 취하고 있습니다. 우리도 **MVP 단계에서는 웹 대시보드(Streamlit)**로 데모를 구현하되, 호응이 좋고 상용화 단계로 갈 것 같다면 모바일 앱이나 PWA 형태로 포팅하는 로드맵을 그릴 수 있습니다. SoundLab의 프론트엔드 코드와 구조(예: layout.py와 여러 UI 컴포넌트 모듈)도 비교적 단순하여, 필요한 UI요소를 추가/변경하기에 부담이 크지 않습니다.

 

개발 우선순위(MVP 로드맵) 관점에서 보면: 1순위는 스펙트로그램 시각화 + 드로잉 기능입니다. 이것만 구현되면 기본적인 “색칠 공부” 인터페이스의 모양이 나와서, 사용자 테스트나 데모에 큰 도움이 됩니다. Plotly의 Heatmap이나 imshow로 스펙트로그램을 그리고, 그 위에 투명도 있는 Overlay나 스트림릿 캔버스로 사용자의 입력을 받는 부분을 먼저 만들면 됩니다. 2순위는 AI 더미 데이터 연동으로, 백엔드에 미리 준비된 이상 구간 및 라벨 결과를 JSON이나 numpy 배열로 갖다 놓고, UI 로딩 시 해당 부분을 하이라이트+제안 뜨도록 하는 것입니다. 이 두 가지가 연결되면 **“AI가 먼저 제안 -> 사용자가 OX 결정 -> 필요시 드로잉으로 수정”**의 핵심 흐름을 일단 끝까지 실행해볼 수 있습니다. 마지막으로 3순위로 마그네틱 보정 알고리즘을 연구/구현하면 좋습니다. 이 부분은 신호 세기 그래디언트를 따라 경계를 찾는 이미지 처리 알고리즘이나, 머신러닝을 활용한 분할도 가능하겠지만, 난이도를 고려해 간단한 방식(예: 현재는 사용자가 칠한 주변의 dB값 threshold 이상인 영역을 flood-fill)으로 시작해도 될 것입니다. 이 알고리즘이 성공하면 사용자는 **“대충 칠해도 알아서 딱 달라붙네!”**라는 놀라운 경험을 하게 되어 제품 완성도가 올라갈 것입니다.

결론 및 종합 평가

제시된 스마트 스펙트로-태깅 계획은 현실적으로 구현 가능하며, 특히 기존 SoundLab의 기술 자산을 활용하면 개발 난이도가 낮아집니다. 핵심 UX 아이디어들(선제 AI분석, OX검증, 자유 영역태깅, 경량 게이미피케이션)은 각각 명확한 구현 방법이 있고, 일부는 이미 업계 사례나 오픈소스로 검증된 것들입니다. 초기에는 현재의 Streamlit 기반 프로토타입으로도 충분히 데모를 만들 수 있으며, 필요시 점진적으로 더 적합한 기술스택으로 옮겨갈 수 있습니다. 무엇보다 이 컨셉은 **“소리를 눈으로 보고 관리”**한다는 인상을 줄 수 있는 멋진 시각화와, AI와 사용자 협업을 강조한 UX로 차별화되므로, 구현만 된다면 현장 적용과 설득력 측면에서도 큰 강점을 가질 것입니다. 전체적으로 개발 리스크도 크지 않고, 특히 1~2단계 기능은 빠르게 완성시켜 클라이언트 데모에 활용할 수 있을 것으로 판단됩니다. SoundLab을 통해 확보한 노하우를 바탕으로, 이 스마트 태깅 프로젝트를 충분히 현실화할 수 있습니다.

 

출처: SoundLab 프로젝트 문서, SpectroDraw 사례, Streamlit Drawable Canvas 컴포넌트 등 참고.

출처
이내용을 바탕으로 어떻게 개발계획서를짤수있을까 

좋아요 👍
지금까지 정리된 스마트 스펙트로-태깅 실현 가능성 분석을 기반으로
👉 “냉동기 제조사 데모용 개발계획서” 형태로 바로 쓸 수 있는 구조를 만들어드릴게요.

이건 그냥 설명 문서가 아니라 제안서/사업계획서에 그대로 들어갈 수준으로 구성해볼게요.

스마트 스펙트로-태깅 개발 계획서 (초안)
1. 프로젝트 개요
1.1 프로젝트 명

Smart Spectro-Tagging (AI 협업 음향 진단 플랫폼)

1.2 한 줄 정의

AI가 먼저 이상 소음을 찾아 표시하고,
현장 기술자는 “색칠하듯 확인”하는 시각적 협업 진단 도구

1.3 개발 목적 (냉동기 제조사 관점)

현재 문제

이상소음 데이터 라벨링이 어려움

음향 분석은 전문가 의존도가 높음

현장 기술자가 AI 학습 데이터 생산에 참여하기 어려움

목표

비전문가도 5분 안에 이상 소음 라벨링 가능

AI 모델 학습 데이터 생산 속도 10배 향상

“AI + 현장 전문가 협업” 워크플로우 구축

👉 핵심 메시지
“소리 데이터 라벨링을 전문가 영역 → 현장 참여형 작업으로 전환”

2. 개발 목표 (Project Goals)
구분	목표
기술 목표	스펙트로그램 기반 인터랙티브 라벨링 시스템 구축
UX 목표	비전문가도 교육 없이 사용 가능한 직관적 인터페이스
데모 목표	냉동기 제조사 대상 AI 기술력 시연
사업 목표	AI 음향 진단 SaaS/플랫폼 기반 확보
3. 핵심 기능 정의 (Core Features)
3.1 AI 선행 추론 (AI Co-Pilot)

기능

소리 입력 → AI가 먼저 이상 구간 탐지

스펙트로그램 위에 자동 마스크 표시

라벨 후보 제안 (예: 베어링 마모)

사용자 경험

앱을 켜면 이미 분석 결과가 보인다.

기술 구현

기존 SoundLab 분석 엔진 재사용

이상 구간 → Mask Overlay 표시

핵심 메시지 (데모용)
👉 “AI가 먼저 찾았습니다.”

3.2 Tinder 방식 검증 UX

기능

AI 결과 빠른 검증

O / X 버튼 or Swipe

사용자 행동

맞음 → 승인

틀림 → 수정 모드 진입

효과

라벨링 속도 극대화

게임처럼 가벼운 경험 제공

3.3 스마트 컬러링 (Magnetic Brush)

이 프로젝트의 핵심 차별화 기능 ⭐

기능

사용자가 대충 칠해도 자동 보정

에너지 높은 영역에 자동 스냅

효과

정밀 라벨링 부담 제거

비전문가 참여 가능

메시지

“형광펜으로 슥슥 칠하면 끝”

3.4 라이트 게이미피케이션

기능

작업 점수 시스템

간단한 랭킹 표시

목적

지루함 제거

참여도 증가

4. 시스템 아키텍처
4.1 전체 구조
Audio Data
   ↓
Python AI Engine (SoundLab)
   ↓ API
React Web App
   ↓
User Feedback Data 저장

4.2 기술 스택
영역	기술
프론트엔드	React + Canvas/WebGL
백엔드	Python (FastAPI)
AI 분석 엔진	기존 SoundLab 재사용
시각화	Web Audio API + Canvas
저장소	Supabase or Firebase

👉 중요한 포인트
Streamlit → React 전환은 “확장 단계”

초기 데모는 Streamlit도 가능하지만
👉 제조사 데모는 React가 훨씬 설득력 있음

5. 개발 로드맵 (MVP 중심)
Phase 1 — 시각화 MVP (1개월)

목표
스펙트로그램 + 드로잉 가능 상태

개발 항목

스펙트로그램 표시

드로잉 기능 구현

기본 UI 구성

결과물
👉 “색칠 가능한 스펙트로그램”

Phase 2 — AI 협업 흐름 (1개월)

목표
AI → 사용자 검증 흐름 완성

개발 항목

AI 더미 결과 표시

O/X 검증 UX

라벨 저장 기능

결과물
👉 “AI + 인간 협업 라벨링 완성”

Phase 3 — Magnetic Brush (1~2개월)

목표
UX 완성도 상승

개발 항목

자동 영역 보정 알고리즘

에너지 기반 스냅 구현

결과물
👉 “기술 데모 핵심 기능”

Phase 4 — 데모 패키지 (2주)

목표

냉동기 제조사 데모

포함

샘플 데이터

점수 시스템

랭킹 UI

6. 총 개발 일정
단계	기간
Phase 1	1개월
Phase 2	1개월
Phase 3	1~2개월
Phase 4	2주

👉 총 기간
약 3~4개월

7. 기술 시연 전략 (매우 중요)

데모 메시지 3가지

1️⃣ 소리를 눈으로 본다

컬러 마스크가 씌워진 스펙트로그램

2️⃣ AI가 먼저 찾는다

자동 분석 결과 표시

3️⃣ 누구나 라벨링 가능

색칠 놀이 UX

👉 이 3개가 제조사 설득 포인트

8. 기대 효과
기술 효과

AI 음향 데이터 생산 속도 증가

모델 성능 개선 기반 확보

사업 효과

제조사 PoC 가능

SaaS 확장 가능

9. 결론

이 프로젝트는

❌ 연구 프로젝트가 아니라
👉 데모 + 사업화 가능 프로젝트

핵심 가치

시각화

협업

현장 적용성

원하면 다음 단계로
👉 예산 계획 / 정부지원사업용 버전도 만들어드릴게요 😎

meta-prompt-for-prd.md
파일
PRD.md
파일
이내용을 바탕으로 상세한 와이어프레임과 앱진입과 마칠떄까지의 흐름을  첨부한문서처럼 굉장히 상세하게 작성하고싶어. 일단 참고한문서가 어떠한구조로 만들어졌는지 분석

좋은 질문 👍
지금부터가 진짜 중요한 단계예요.
“문서를 쓰기 전에, 참고 문서의 뼈대(structure)를 먼저 해부” 해야 합니다.

지금 올려주신 두 문서는 그냥 PRD가 아니라
👉 PRD를 생성하기 위한 ‘메타 구조 템플릿’ + 실제 PRD 완성본 입니다.

즉 우리가 만들려는 “스마트 스펙트로-태깅 PRD”도
이 구조를 그대로 복제해서 내용만 바꾸면 됩니다.

1️⃣ 먼저 결론부터: 이 문서들의 핵심 특징

이 PRD는 그냥 기능 나열 문서가 아니라 **“프론트엔드부터 개발 가능한 설계 문서”**입니다.

일반 PRD와 다른 핵심 특징:

일반 PRD	이 PRD
기능 설명 위주	UI → 컴포넌트 → DB → API → 권한까지 풀스택 설계
추상적	개발자가 바로 코딩 가능한 수준
흐름 중심	화면 중심 + 컴포넌트 중심
와이어프레임 간단	ASCII 와이어프레임 매우 상세

👉 즉 이 문서는
“제품 기획서 + 설계서 + 개발 명세서”가 합쳐진 형태

우리가 만들려는 것도 동일 스타일로 가야 함.

2️⃣ 문서 전체 구조 해부 (큰 틀)

PRD.md 기준 전체 구조:

1. 프로젝트 개요
2. 기술 스택
3. 시스템 아키텍처
4. DB 스키마
5. 공통 컴포넌트
6. 페이지 상세 명세
7. 상태 관리
8. API
9. 권한
10. 에러 핸들링
11. 개발 페이즈


이 구조가 핵심입니다.

이 순서는 매우 의도적이에요.

왜 이 순서인가?

이 문서는 Frontend First 개발 전략 기반입니다.

문서 흐름을 보면:

제품 설명 → 기술선택 → 폴더구조 → 컴포넌트 → 화면 → 데이터 → API


즉 개발 순서 그대로입니다.

👉 이게 핵심 포인트

3️⃣ 문서 레이어 구조 (진짜 핵심)

이 PRD는 6개의 레이어로 구성됩니다.

이걸 이해해야 같은 스타일로 쓸 수 있어요.

Layer 1 — Product Layer (제품 설명)

문서 초반:

프로젝트 개요

핵심 기능

개발 전략

이 부분은 비개발자도 이해 가능 영역.

예:

목표

핵심 기능

단계 전략

👉 사업계획서 느낌

Layer 2 — Tech Stack Layer

기술 선택 이유 + 스택 정의

특징:

버전까지 명시

상태관리 분리

외부 API 명시

이 단계부터 개발 문서로 전환됨

Layer 3 — Architecture Layer (아키텍처)

여기서 문서가 갑자기 매우 개발자 친화적으로 변함.

핵심 3개:

디렉토리 구조

라우팅 맵

사이드바 메뉴 구조

이건 거의 코드 작성 직전 단계 설계임.

예:

src/app/(dashboard)/purchase/list


이건 실제 폴더 구조입니다.

👉 즉 이 PRD는 코드 구조까지 설계된 PRD

Layer 4 — Component Layer (이 문서의 핵심)

이 문서가 특별한 이유 ⭐⭐⭐

“공통 컴포넌트 명세”가 있음.

예:

ListPage

InputModal

RegisterPage

SearchPanel

DataTable

그리고 여기서 끝이 아님.

각 컴포넌트에:

ASCII 와이어프레임

Props 인터페이스

동작 규칙

까지 있음.

이게 진짜 핵심입니다.

👉 이 PRD = 와이어프레임 문서

Layer 5 — Page Layer (화면 상세 명세)

이제 페이지별로 들어감.

패턴이 완전히 반복됩니다:

페이지 → 레이아웃 → 테이블 → 필드 → 동작 로직


즉 페이지 문서도 사실상 컴포넌트 조합 설명임.

중요 포인트:

이 문서는 페이지를 처음부터 새로 설명하지 않음

이미 만든 공통 컴포넌트를 조합해서 설명함.

예:

레이아웃: RegisterPage 컴포넌트 사용


이게 매우 중요합니다.

👉 즉 문서 구조가 컴포넌트 중심 설계

Layer 6 — Data Layer

마지막으로 DB 스키마 등장.

순서 중요:

UI → 컴포넌트 → 페이지 → DB

보통은 DB부터 시작하지만
이 문서는 UI부터 시작합니다.

이게 “Frontend First 전략”.

4️⃣ 문서 스타일 분석 (작성 방식)

이 PRD의 문체 특징:

특징 1 — 항상 “레이아웃 → 필드 → 동작” 순서

예:

레이아웃:
테이블:
핵심 로직:


이 패턴이 모든 페이지에 반복됨.

특징 2 — ASCII 와이어프레임 중심

모든 핵심 화면에 이런게 있음:

┌──────────────┐
│ 화면 구조     │
└──────────────┘


즉 실제 와이어프레임 대신
텍스트 기반 와이어프레임 사용.

👉 우리가 만들 것도 동일하게 해야 함.

특징 3 — “동작 규칙”이 매우 많음

예:

F3 단축키

자동 계산

자동 포맷

즉 단순 UI 설명이 아니라
UX 동작까지 상세 정의

5️⃣ 가장 중요한 구조 패턴

이 문서의 핵심 공식:

제품 → 기술 → 폴더 → 컴포넌트 → 페이지 → DB → API


이 순서를 그대로 복제하면 됩니다.

6️⃣ 우리가 만들 문서와의 매핑

이제 중요한 부분 🔥

ERP → 스마트 스펙트로태깅으로 치환하면:

ERP 문서	우리가 만들 문서
ListPage	SpectrogramPage
InputModal	LabelingPanel
RegisterPage	DatasetManager
Sidebar	Workspace
Purchase	Labeling Session
Sales	Annotation Result

즉 구조는 그대로 쓰고
도메인만 바꾸면 됨

다음 단계

이제 할 일:

1️⃣ 스마트 스펙트로태깅용
PRD 목차 구조 먼저 만들기

그 다음
2️⃣ 사용자 흐름 → 와이어프레임 작성

원하면 다음 단계로
👉 스마트 스펙트로-태깅 PRD 목차 구조 설계 바로 시작할게요.

진행해줘

좋습니다 🔥
이제 ERP PRD 구조를 그대로 복제해서
👉 스마트 스펙트로-태깅 전용 PRD 목차 구조를 설계합니다.

이건 그냥 목차가 아니라
**이 순서대로 쓰면 완성되는 “PRD 뼈대”**입니다.

Smart Spectro-Tagging PRD 구조 (전체 목차)

ERP 문서 구조를 1:1로 매핑해서 만든 최종 구조입니다.

이 구조가 앞으로 우리가 채워갈 “큰 틀”입니다.

0️⃣ 문서 목적 (헤더)

문서 상단 고정 영역

Smart Spectro-Tagging — Product Requirements Document

Version:
Status: Phase 1 — Frontend First
Target: 냉동기 제조사 데모

1️⃣ 프로젝트 개요 (Product Layer)

ERP 문서의 1번 섹션과 동일한 역할.

여기는 비개발자도 이해하는 영역입니다.

1.1 목표

AI 협업 음향 라벨링 플랫폼 구축

냉동기 이상 소음 진단 PoC

데이터 생산 자동화 기반 확보

1.2 핵심 컨셉

AI 선행 추론 (AI Co-Pilot)

Tinder 방식 검증 UX

Magnetic Brush 라벨링

게이미피케이션

1.3 개발 전략

ERP 문서처럼 Phase 전략 명시:

Phase 1 : Frontend First (Mock + Dummy AI)
Phase 2 : Python AI 엔진 연동
Phase 3 : 실사용 데이터/협업 기능

2️⃣ 기술 스택 (Tech Stack Layer)

ERP 문서 구조 그대로 사용.

2.1 Frontend

Next.js / React

Canvas / WebGL

Web Audio API

2.2 Backend

FastAPI

SoundLab 분석 엔진

Supabase (저장)

2.3 AI 엔진

Spectrogram 분석

이상구간 탐지

라벨 추천 모델

3️⃣ 시스템 아키텍처 (Architecture Layer)

여기서부터 개발 문서 느낌 시작.

3.1 디렉토리 구조

ERP 문서처럼 폴더 구조 작성

예:

app/
 ├ dashboard/
 ├ labeling/
 ├ datasets/
 ├ sessions/
 ├ leaderboard/


👉 이거 나중에 실제 코드 구조가 됨.

3.2 라우팅 맵

ERP 문서처럼 URL 정의

예:

URL	페이지
/	Dashboard
/labeling	Spectrogram Labeling
/datasets	Dataset Manager
/sessions	Labeling Sessions
/leaderboard	Ranking
3.3 Workspace 메뉴 구조

ERP의 Sidebar 메뉴 역할.

Dashboard
Labeling
Datasets
Sessions
Leaderboard
Settings

4️⃣ 공통 컴포넌트 명세 (🔥 핵심)

이 섹션이 가장 중요합니다.

ERP 문서에서 가장 큰 분량 차지.

우리가 만들 컴포넌트:

ERP	우리
ListPage	DashboardLayout
InputModal	LabelReviewPanel
RegisterPage	DatasetManager
DataTable	SessionTable

여기서 정의할 핵심 컴포넌트:

4.1 SpectrogramCanvas ⭐⭐⭐

앱의 심장

스펙트로그램 렌더링

AI 마스크 표시

드로잉 기능

4.2 AI Suggestion Panel

AI 확률 표시

O/X 버튼

4.3 Labeling Toolbar

브러시

지우개

Undo/Redo

4.4 Magnetic Brush Engine

에너지 기반 스냅

영역 자동 보정

4.5 Session Layout

좌측: 파일 리스트

중앙: 스펙트로그램

우측: 라벨 패널

👉 이 섹션에 ASCII 와이어프레임 들어감.

5️⃣ 페이지 상세 명세 (User Flow Layer)

이제 진짜 와이어프레임 영역 시작.

ERP 문서의 절반이 이 부분.

여기서 작성할 페이지:

5.1 로그인
5.2 온보딩
5.3 대시보드
5.4 라벨링 세션 (핵심)
5.5 결과 저장
5.6 리더보드

👉 여기에 앱 시작 → 종료 전체 흐름 들어감.

6️⃣ 상태 관리 설계 (State Layer)

React 상태 구조 정의.

예:

currentAudio

aiSuggestions

userAnnotations

score

7️⃣ API 설계 (API Layer)

FastAPI 엔드포인트 정의.

예:

/analyze-audio

/save-label

/get-session

8️⃣ 데이터 모델 (DB Layer)

Supabase 테이블 정의.

예:

audio_files

annotations

sessions

users

9️⃣ 게이미피케이션 로직

ERP에는 없던 섹션 → 추가.

점수 계산

랭킹

🔟 개발 페이즈 계획

ERP 문서 마지막 섹션 그대로.

⭐ 지금 상태 요약

우리는 이제:

구조 분석 완료 ✅

PRD 목차 완성 ✅

다음 단계부터 진짜 핵심 시작:

👉 앱 진입 → 종료까지 사용자 흐름 + 와이어프레임 작성

다음 단계에서 바로
앱 전체 User Journey 작성 들어가겠습니다.

진행 

좋습니다 🔥
이제부터가 진짜 핵심 단계입니다.

지금부터 작성하는 내용은
앱 실행 → 종료까지 전체 사용자 여정(User Journey) 입니다.

그리고 ERP 문서 스타일 그대로
👉 화면 흐름 + UX 동작까지 초상세로 작성합니다.

Smart Spectro-Tagging
5️⃣ 사용자 흐름 & 페이지 상세 명세 (User Journey)

목표
👉 “앱 켜고 → 라벨링 → 저장 → 점수 확인 → 종료”
전체 흐름을 1픽셀 단위로 설계

전체 사용자 여정 한눈에 보기
로그인
 → 온보딩
 → 대시보드
 → 라벨링 세션 생성
 → AI 분석 자동 실행
 → AI 제안 검증 (Tinder)
 → 사용자 색칠 수정 (Magnetic Brush)
 → 결과 저장
 → 점수 & 랭킹 확인
 → 종료


이 흐름을 이제 화면 단위로 분해합니다.

5.1 로그인 페이지
목적

사용자 식별

세션 시작

화면 구조 (Wireframe)
┌────────────────────────────┐
│  Smart Spectro-Tagging     │
│                            │
│  [ 이메일 입력 ]            │
│  [ 비밀번호 입력 ]          │
│                            │
│  [ 로그인 ]                │
│                            │
│  또는                     │
│  [ Google 로그인 ]         │
└────────────────────────────┘

동작 규칙

로그인 성공 → Dashboard 이동

최초 로그인 → Onboarding 이동

5.2 온보딩 (첫 사용자 전용)
목적

이 앱이 뭔지 30초 설명.

화면 흐름
Step 1 — 컨셉 설명
"AI가 먼저 소리를 찾습니다"
[다음]

Step 2 — 협업 설명
"당신은 맞는지만 확인하세요"
[다음]

Step 3 — 색칠 설명
"틀리면 색칠하세요"
[시작하기]


→ Dashboard 이동

5.3 대시보드 (앱 메인)
목적

작업 시작 허브

화면 구조
┌────────────────────────────────────┐
│  🎧 Dashboard                      │
├────────────────────────────────────┤
│  오늘 작업 점수 : 120점            │
│  오늘 처리 파일 : 18개             │
│                                    │
│  [ 새 라벨링 시작 ]  ← PRIMARY CTA │
│                                    │
│  최근 작업 파일                    │
│  • compressor_01.wav               │
│  • motor_noise_02.wav              │
└────────────────────────────────────┘

사용자 행동

👉 “새 라벨링 시작” 클릭

→ 파일 업로드 화면 이동

5.4 파일 업로드 화면
목적

라벨링할 오디오 선택

Wireframe
┌────────────────────────────────────┐
│  Upload Audio                      │
├────────────────────────────────────┤
│   Drag & Drop                      │
│   or                               │
│   [ 파일 선택 ]                    │
│                                    │
│  지원: WAV, MP3                    │
└────────────────────────────────────┘

동작

파일 업로드 완료 순간:

👉 AI 분석 자동 시작

5.5 AI 분석 로딩 화면

이 화면이 매우 중요 ⭐

UX 메시지

“AI가 먼저 찾는 중입니다”

Wireframe
┌────────────────────────────────────┐
│  🔍 AI analyzing sound...          │
│                                    │
│      ███████████ 72%               │
│                                    │
│  이상 소음을 찾고 있습니다          │
└────────────────────────────────────┘


완료 → 라벨링 화면 진입

5.6 핵심 화면 ⭐
라벨링 세션 화면

이 앱의 심장

전체 레이아웃
┌───────────────┬───────────────────┬──────────────┐
│ File List      │  Spectrogram      │ AI Panel     │
│                │                   │              │
│ compressor.wav │   (Canvas)        │ 80% 확률     │
│ motor.wav      │                   │ 베어링 마모   │
│ pump.wav       │                   │              │
│                │                   │ [ O ] [ X ]  │
└───────────────┴───────────────────┴──────────────┘


3컬럼 레이아웃.

5.7 Step 1 — AI 선행 추론 표시

스펙트로그램 위 상태:

██████  ← 반투명 박스 (AI 마스크)


오른쪽 패널:

AI 감지 결과
베어링 마모
신뢰도 82%

[ 맞음 O ] [ 틀림 X ]

5.8 Step 2 — Tinder 검증
O 클릭

→ 다음 제안으로 이동
→ 점수 +10

X 클릭

→ 수정 모드 진입

이 전환이 핵심 UX

5.9 Step 3 — 색칠 모드 진입 ⭐

툴바 활성화됨

[ 브러시 ] [ 지우개 ] [ Undo ] [ Redo ]


마우스 드래그 → 색칠

🖌️ 사용자가 대충 칠함


즉시:

👉 Magnetic Brush 작동

대충 칠한 영역 → 에너지 영역으로 자동 보정


사용자 경험 핵심 문장:
“와 대충 칠해도 자동으로 붙네”

5.10 수정 완료

버튼:

[ 수정 완료 ]


클릭 → 점수 +20

→ 다음 AI 제안 이동

5.11 모든 구간 완료

팝업 등장:

🎉 라벨링 완료!

정확도: 92%
획득 점수: +140

5.12 결과 저장 화면
[ 결과 저장 ]
[ 다음 파일 진행 ]


저장 → Leaderboard 이동

5.13 리더보드 화면

게이미피케이션

🏆 오늘의 랭킹

1위 Alex  540점
2위 Kim   420점
3위 You   380점

5.14 세션 종료

버튼:

[ 대시보드로 돌아가기 ]


→ Dashboard

현재까지 완료된 것

우리는 지금:

✔ 전체 사용자 여정 완성
✔ 핵심 화면 정의 완료

다음 단계는 진짜 핵심:

👉 라벨링 화면 와이어프레임 초초상세 버전
(컴포넌트 수준 분해)

다음 단계 진행할까요? 😎

진행 

좋아요. 이제부터는 ERP PRD처럼 “라벨링 핵심 화면을 컴포넌트 단위로 분해 + 와이어프레임/동작규칙/상태/예외까지” 초상세로 들어갑니다.
(여기부터가 진짜 개발자 바로 코딩 가능한 문서 스타일)

6. 페이지별 상세 명세
6.4 라벨링 세션 (핵심) — /labeling/[sessionId]
목적

업로드된 오디오(또는 스트리밍)를 스펙트로그램으로 시각화

AI가 제안한 이상 구간을 빠르게 O/X로 검증

틀린/누락 구간을 “색칠”로 수정

수정 결과를 저장하고 점수화하여 세션을 완료

6.4.1 전체 레이아웃 (3-Panel Workspace)
화면 와이어프레임 (Desktop 기준)
┌──────────────────────────────────────────────────────────────────────────────┐
│ TopBar: [← Dashboard]  Session: S-2026-0210-001  |  AutoSave: ON  |  User: Kim │
├───────────────┬───────────────────────────────────────────┬──────────────────┤
│ Left Panel    │ Center Canvas (Spectrogram + Overlays)     │ Right Panel      │
│ (File Queue)  │                                           │ (AI & Labels)     │
│               │  ┌─────────────────────────────────────┐  │                  │
│  Files        │  │  SpectrogramCanvas                  │  │  AI Suggestion   │
│  ─────────    │  │  - heatmap                          │  │  ┌────────────┐  │
│  ▶ A.wav      │  │  - time axis                         │  │  │ Label:     │  │
│    B.wav      │  │  - freq axis                         │  │  │ Bearing... │  │
│    C.wav      │  │  - AI mask overlays                  │  │  │ Conf: 82%  │  │
│               │  │  - user paint overlays               │  │  └────────────┘  │
│  Meta         │  └─────────────────────────────────────┘  │  [O] Confirm      │
│  - SR 16k     │                                           │  [X] Reject       │
│  - Len 32s    │  Toolbar: [Brush] [Eraser] [Box] [Undo]   │                  │
│               │           [Redo] [Zoom] [Pan] [Snap:ON]    │  If Reject:       │
│  Timeline     │                                           │  Edit Mode Panel  │
│  - Peaks log  │  Bottom: Player [◀◀] [▶/⏸] [▶▶]  00:12/32 │  - Choose Label   │
│               │          Speed [0.5x][1x][2x]  Volume      │  - Paint/Box      │
├───────────────┴───────────────────────────────────────────┴──────────────────┤
│ Footer: Progress 3/18 files | Suggestions 5/12 | Score +120 | Export | Help   │
└──────────────────────────────────────────────────────────────────────────────┘

레이아웃 규칙

Left Panel(파일 큐): 작업 순서/메타/로그

Center(캔버스): 스펙트로그램 + 모든 오버레이(마스크/페인트/박스)

Right(AI 패널): 제안 카드 + O/X + 수정 패널(Reject 시)

6.4.2 핵심 컴포넌트 정의 (ERP PRD 스타일)
A) SessionLayout

역할: 3패널 레이아웃과 전역 단축키/저장 상태를 오케스트레이션

Props

interface SessionLayoutProps {
  sessionId: string;
  initialFiles: AudioFileMeta[];
  initialSettings?: SessionSettings;
}


State (전역)

currentFileId

currentSuggestionId

mode: 'review' | 'edit'

autosave: boolean

networkStatus: 'online' | 'offline'

scoreState: { total, delta, streak }

동작 규칙

세션 진입 시: 첫 파일 자동 선택 → AI 분석 트리거(또는 Dummy 로드)

autosave ON이면: 변경 발생 후 3초 idle 시 저장 요청

offline이면: local queue로 적재 후 online 복귀 시 배치 전송

B) FileQueuePanel (Left)

역할: 파일 리스트 + 진행 상태 + 파일 메타 + 이벤트 로그(피크/이상)

Wireframe

Files
┌───────────────────────────┐
│ ▶ A.wav   [Analyzed]      │
│   B.wav   [Pending]       │
│   C.wav   [Pending]       │
├───────────────────────────┤
│ Meta                      │
│ SR: 16000Hz  Len: 00:32   │
│ Device: machine_01        │
├───────────────────────────┤
│ Events (click -> jump)    │
│ 00:12 Peak detected       │
│ 00:18 AI anomaly          │
└───────────────────────────┘


동작 규칙

파일 클릭 시: 현재 편집 내용 저장 여부 체크

autosave ON: 즉시 저장 후 이동

autosave OFF: “저장/버림” 모달

이벤트 클릭 시: 캔버스가 해당 타임스탬프로 점프 + 줌

C) SpectrogramCanvas (Center)

역할: 스펙트로그램 렌더 + AI 마스크 + 유저 페인트 + 히트 테스트(선택)

레이어 구조(중요)

Base Layer: Spectrogram heatmap

Overlay 1: AI masks (rect/polygon, semi-transparent)

Overlay 2: User annotations (paint strokes / boxes)

Overlay 3: Hover/Selection (outline, handles)

Overlay 4: Cursor (playhead line, crosshair)

Canvas Interaction 모드

mode='review': 선택/확인 중심

mode='edit': 그리기 중심

정밀 기능(필수)

줌/팬: 마우스 휠 줌, 스페이스+드래그 팬

플레이헤드: 재생 위치 실시간 수직선 표시

스냅(마그네틱): Snap: ON/OFF 토글

입력 이벤트 규칙

click: 가장 상단 레이어(선택 가능한) 오브젝트 선택

drag:

Brush: 자유 곡선 stroke 기록

Box: 사각형 생성

shift: 다중 선택(선택된 마스크 그룹화 저장 가능)

D) AISuggestionPanel (Right)

역할: AI가 제안한 “현재 카드”를 보여주고 O/X 액션 처리

Wireframe

AI Suggestion
┌─────────────────────────┐
│ Label: Bearing Wear     │
│ Conf : 82%              │
│ Time : 00:12 ~ 00:14    │
│ Band : 110~140Hz        │
│ Preview: mini-map       │
└─────────────────────────┘
[ O Confirm ]  [ X Reject ]
Shortcut: O / X


동작 규칙

카드가 바뀔 때마다: 캔버스가 해당 구간으로 자동 줌인

O Confirm:

현재 제안 mask를 “확정(locked)” 상태로 저장

점수 +10, streak +1

다음 suggestion로 자동 이동

X Reject:

mode를 'edit'로 전환

“왜 틀렸나” 2가지 경로 제공:

라벨은 맞는데 구간이 틀림 (Adjust Range)

라벨 자체가 틀림 (Change Label)

E) EditModePanel (Reject 이후)

역할: 수정 흐름을 강제 안내 (사용자가 길 잃지 않게)

Wireframe

Edit Mode
Why Reject?
( ) Label wrong
( ) Range wrong
( ) Missed anomaly (AI didn't catch)

If Label wrong:
  Label Picker [Bearing][Fan][Compressor]...

If Range wrong / Missed:
  Tools: [Brush] [Box] [Eraser]
  Snap: ON  Threshold: Auto
[ Apply Fix ]   [Cancel]


Apply Fix 동작

사용자가 만든 영역을 annotation으로 저장

필요 시 기존 AI mask는 “rejected” 상태로 남김(학습 데이터용)

점수 +20(수정 기여), streak 유지/초기화는 정책 선택:

추천: streak 유지(몰입감), 단 정확도는 별도 계산

6.4.3 “마그네틱 브러시” 상세 동작 규칙 (초상세)
목표 UX

사용자는 “대충 칠함”

시스템이 “에너지 강한 영역”으로 경계를 자동 보정

처리 파이프라인(권장 MVP → 고도화)
MVP v1 (빠른 구현)

사용자가 stroke로 칠한 픽셀 집합 P 수집

스펙트로그램 intensity 맵 S(x,y)에서
P 주변 반경 r 내 픽셀만 검사

자동 임계값(예: Otsu/percentile)로 “강한 영역” 마스크 M

M과 P를 결합해 최종 영역 A 생성

A를 polygon/bitmap annotation으로 저장

UX 옵션

“보정 강도” 슬라이더(약/중/강) → r 또는 threshold에 매핑

v2 (더 깔끔한 경계)

A에 대해 morphology(close/open)로 노이즈 제거

경계 추출(contour) → polygon 단순화(Douglas-Peucker)

v3 (프로급)

그래프 컷 / active contour / lightweight segmentation 모델

6.4.4 점수/정확도/로그 정책 (게이미피케이션 룰)
점수 규칙(초안)

Confirm(O): +10

Reject 후 Fix 적용: +20

Missed anomaly 새로 추가: +30

연속 처리 streak:

5연속: 보너스 +20

10연속: 보너스 +50

정확도 정의

AI precision: Confirm / (Confirm+Reject)

User correction rate: Fix count / Reject count

Coverage: (AI+User) annotations / expected segments(선택)

로그 기록(필수)

모든 액션 이벤트는 타임스탬프와 함께 저장

CONFIRM, REJECT, PAINT_START, PAINT_APPLY, UNDO, EXPORT

6.4.5 저장/내보내기(Export) 화면 흐름
저장 트리거

Confirm/O 즉시 저장(경량)

Apply Fix 즉시 저장(중요)

파일 전환 시 저장

세션 종료 시 “마지막 저장 확인”

Export 포맷 (MVP)

JSON: annotations + meta + model suggestions

CSV: 구간(start/end) + label + conf + source(AI/User)

6.4.6 단축키(ERP PRD처럼 명확히)

O: Confirm

X: Reject

B: Brush

E: Eraser

R: Box/Rect tool

Ctrl+Z: Undo

Ctrl+Shift+Z: Redo

Space: Pan (hold)

?: Help overlay

6.4.7 예외/에러 케이스 (현장 UX 필수)
1) AI 결과가 없음

메시지: “AI가 확신하는 구간이 없습니다. 직접 탐색/색칠로 라벨링 해주세요.”

오른쪽 패널은 “Manual Mode”로 전환

2) 오디오가 너무 김(>5분)

기본 줌 레벨: 전체 보기 → 이벤트/AI 구간 클릭 시 자동 줌인

“구간 탐색 바(미니맵)” 제공

3) 저장 실패 / 네트워크 불안정

TopBar에 “Offline queue 3” 표시

성공 시 자동 동기화

4) 실수로 Reject 연타

Reject 시 1초 동안 “Undo Reject” 토스트 제공

여기까지가 “라벨링 화면” 초상세 설계 1차 완성

다음 단계는 더 디테일하게 갑니다:

데이터 모델(Annotation, Suggestion, Session) 타입 정의

페이지별 상세(대시보드/세션 리스트/데이터셋 매니저)도 동일 수준으로 작성

모바일/태블릿 대응 와이어프레임(현장 기사 UX)

원하시면 바로 다음으로 **6.5 “세션 리스트 / 세션 생성 플로우”**를 ERP 문서처럼 초상세로 이어서 작성할게요.

ㄱ

좋습니다 😎
이제 ERP PRD 스타일 그대로 다음 페이지 흐름 이어갑니다.

지금부터는 라벨링 화면 “이전 단계”와 “이후 단계”를 채워서
앱 전체가 완전히 이어지게 만듭니다.

6.5 세션 리스트 / 세션 생성 플로우
/sessions

라벨링 화면으로 들어가기 전 허브입니다.
ERP 문서의 조회 페이지(ListPage) 역할.

6.5.1 목적

라벨링 작업 단위를 “Session”으로 관리

작업 진행률 / 점수 / 상태 확인

새 라벨링 시작 진입점

👉 Dashboard → Sessions → Labeling 흐름 완성

6.5.2 페이지 레이아웃 (ListPage 패턴)
Wireframe
┌──────────────────────────────────────────────────────────────┐
│  🎧 Labeling Sessions        [검색] [Search(F3)]              │
├──────────────────────────────────────────────────────────────┤
│ ▼ 상세검색                                                   │
│  기간 [____ ~ ____]  상태 [All▼]  사용자 [All▼]               │
├──────────────────────────────────────────────────────────────┤
│ [전체] [진행중] [완료] [오류]                                 │
│ [1] 2 3 4 5                                                  │
├──────────────────────────────────────────────────────────────┤
│ □ │ Session ID │ 파일수 │ 진행률 │ 점수 │ 상태 │ 생성일 │     │
│ □ │ S-001      │ 18     │ 35%    │ 120  │ 진행중│ 02-10  │     │
│ □ │ S-002      │ 24     │ 100%   │ 380  │ 완료  │ 02-09  │     │
│ □ │ S-003      │ 12     │ 0%     │ 0    │ 준비중│ 02-09  │     │
├──────────────────────────────────────────────────────────────┤
│ [ 새 세션 생성 ]                                             │
└──────────────────────────────────────────────────────────────┘

컬럼 정의
컬럼	설명
Session ID	고유 작업 ID
파일수	업로드된 오디오 수
진행률	처리 완료 파일 %
점수	획득 점수
상태	준비중 / 진행중 / 완료
생성일	세션 생성 날짜
동작 규칙
행 클릭

→ 라벨링 화면 이동
/labeling/[sessionId]

새 세션 생성 버튼 클릭

→ Session Create Modal 열림

6.5.3 Session Create Modal

ERP의 InputModal 패턴 그대로

Wireframe
┌────────────────────────────────────┐
│  새 라벨링 세션 생성               │
├────────────────────────────────────┤
│ 세션 이름        [____________]     │
│ 장비 유형        [Compressor▼]     │
│ 샘플링 레이트    [16000▼]          │
│                                    │
│ [ 오디오 파일 업로드 ]             │
│                                    │
│ 업로드된 파일 목록                 │
│ • motor_01.wav                     │
│ • motor_02.wav                     │
│ • fan_noise.wav                    │
├────────────────────────────────────┤
│ [ 생성하기 ]  [ 취소 ]             │
└────────────────────────────────────┘

필드 정의
필드	설명
세션 이름	작업 이름
장비 유형	Compressor / Fan / Pump 등
샘플링 레이트	분석 설정
파일 업로드	다중 파일 가능
생성 버튼 클릭 시 흐름
세션 생성
 → 파일 업로드
 → AI 분석 큐 등록
 → Session 상태 = "준비중"
 → 세션 리스트 갱신

6.5.4 세션 상태 머신 (중요)
상태	의미
준비중	업로드 완료 / AI 분석 대기
진행중	라벨링 진행
완료	모든 파일 처리 완료
오류	분석 실패
6.5.5 AI 분석 백그라운드 상태 표시

세션 준비중일 때:

S-004   분석중... 45%


사용자가 들어가면:
→ “AI 분석 중입니다” 화면 표시 후 라벨링 진입

6.6 파일 업로드 단독 페이지 (선택)

ERP 문서 스타일 유지 위해 분리 가능.

/upload

하지만 MVP에서는 세션 생성 모달로 충분.

6.7 세션 완료 플로우 ⭐

라벨링 끝난 뒤 이동하는 화면.

6.7.1 완료 요약 페이지
Wireframe
┌────────────────────────────────────┐
│ 🎉 Session Completed!              │
├────────────────────────────────────┤
│ 처리 파일: 18개                    │
│ AI 제안 검증: 92% 정확도           │
│ 사용자 수정: 14개 구간             │
│ 총 점수: 420                       │
├────────────────────────────────────┤
│ [ 결과 다운로드 ]                  │
│ [ 리더보드 보기 ]                  │
│ [ 새 세션 시작 ]                   │
└────────────────────────────────────┘

6.7.2 결과 다운로드 포맷

버튼 클릭 → Export Modal

Export Format
( ) JSON
( ) CSV
( ) COCO (추후)
[ 다운로드 ]

6.8 리더보드 페이지
/leaderboard

게이미피케이션 화면

Wireframe
┌────────────────────────────────────┐
│ 🏆 Leaderboard                     │
├────────────────────────────────────┤
│ Rank │ User │ Today │ All Time     │
│ 1    │ Alex │ 540   │ 4210         │
│ 2    │ Kim  │ 420   │ 3500         │
│ 3    │ You  │ 380   │ 380          │
└────────────────────────────────────┘

지금까지 완성된 것

우리는 이제:

✔ 로그인
✔ 온보딩
✔ 대시보드
✔ 세션 리스트
✔ 세션 생성
✔ 라벨링 핵심 화면
✔ 완료/결과/리더보드

👉 앱 전체 UX 흐름 완성

다음 단계는 문서 후반부:

상태관리 설계

데이터 모델

API 설계

이제 데이터 모델 설계 들어가면 PRD가 거의 완성됩니다 😎

ㄱㄱ

좋습니다 😎
이제 PRD의 Backend/Data Layer로 들어갑니다.
ERP 문서 흐름 그대로 DB → 상태 → API 순서로 갑니다.

7️⃣ 데이터 모델 설계 (Data Layer)

이 섹션은 실제 Supabase/PostgreSQL 테이블 설계 수준으로 작성합니다.

핵심 원칙:

User → Session → Audio → AI Suggestion → Annotation → Score

7.1 ERD 개요
users
  │
  └── sessions
        │
        ├── audio_files
        │      └── ai_suggestions
        │              └── annotations
        │
        └── session_scores


이 구조 = 라벨링 앱의 뼈대.

7.2 users — 사용자
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'annotator', -- admin / annotator
  created_at TIMESTAMPTZ DEFAULT now()
);

7.3 sessions — 라벨링 세션

세션 = 작업 단위

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  device_type TEXT,          -- compressor / fan / pump
  sample_rate INT,
  status TEXT DEFAULT 'ready', -- ready / analyzing / labeling / completed
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

7.4 audio_files — 업로드된 오디오
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  file_name TEXT,
  duration FLOAT,
  sample_rate INT,
  status TEXT DEFAULT 'pending', -- pending / analyzed / labeled
  created_at TIMESTAMPTZ DEFAULT now()
);

7.5 ai_suggestions — AI 제안

AI가 먼저 만든 “밑그림”

CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_id UUID REFERENCES audio_files(id) ON DELETE CASCADE,

  label TEXT,        -- bearing / fan / compressor
  confidence FLOAT,

  start_time FLOAT,  -- seconds
  end_time FLOAT,

  freq_low FLOAT,
  freq_high FLOAT,

  status TEXT DEFAULT 'pending', -- pending / confirmed / rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

7.6 annotations — 사용자 수정 결과 ⭐

가장 중요한 테이블

CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_id UUID REFERENCES audio_files(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES ai_suggestions(id),

  source TEXT,   -- AI / USER / CORRECTED
  label TEXT,

  start_time FLOAT,
  end_time FLOAT,
  freq_low FLOAT,
  freq_high FLOAT,

  shape TEXT,    -- box / brush / polygon
  geometry JSONB,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

source 의미
값	의미
AI	AI 확정
USER	사람이 직접 추가
CORRECTED	AI 수정
7.7 session_scores — 점수
CREATE TABLE session_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),

  confirm_count INT DEFAULT 0,
  reject_count INT DEFAULT 0,
  fix_count INT DEFAULT 0,

  score INT DEFAULT 0,
  accuracy FLOAT,

  created_at TIMESTAMPTZ DEFAULT now()
);

7.8 action_logs — 행동 로그 (AI 학습 핵심)

AI 학습을 위해 필수 ⭐

CREATE TABLE action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  audio_id UUID REFERENCES audio_files(id),

  action TEXT,   -- CONFIRM / REJECT / PAINT / UNDO
  payload JSONB,

  created_at TIMESTAMPTZ DEFAULT now()
);


👉 미래 AI 학습 데이터

8️⃣ 프론트 상태 관리 설계 (React State)

ERP 문서의 Zustand 파트 대응.

8.1 Global Stores
useSessionStore
currentSession
currentAudio
progress
autosave

useAnnotationStore
aiSuggestions[]
userAnnotations[]
selectedSuggestionId
mode (review/edit)

useScoreStore
currentScore
streak
todayScore

9️⃣ API 설계 (FastAPI)

이제 프론트 ↔ 백엔드 연결.

9.1 세션
POST   /sessions/create
GET    /sessions
GET    /sessions/{id}

9.2 파일
POST   /audio/upload
GET    /audio/{id}

9.3 AI 분석
POST   /ai/analyze-audio
GET    /ai/suggestions/{audioId}

9.4 라벨링
POST   /annotations/save
POST   /suggestions/confirm
POST   /suggestions/reject

9.5 점수
GET /leaderboard
GET /score/{sessionId}

🎉 현재 상태

우리는 지금:

✔ UX 흐름
✔ 와이어프레임
✔ 컴포넌트
✔ DB 설계
✔ 상태관리
✔ API 설계

👉 PRD 90% 완성 상태

마지막 남은 섹션:

권한

에러 처리

개발 페이즈

이거 작성하면 PRD 완성입니다 😎

ㄱ

좋습니다. 이제 PRD 마지막 10% 마무리 들어갑니다.
ERP PRD처럼 권한 → 에러핸들링 → 개발 페이즈 계획까지 초상세로 정리해서 “완성본” 형태로 만들어드릴게요.

10️⃣ 권한 체계 (Permissions)
10.1 역할(Role) 정의
Role	설명	접근 범위
admin	시스템 설정/전체 데이터 관리	전체
annotator	라벨링 수행자(현장 기사 포함)	라벨링 + 세션
viewer	결과 조회 전용(제조사 임원/고객)	조회/리포트
10.2 권한 키 구조 (ERP 방식)

권한 키는 문자열로 관리 (추후 RLS/미들웨어에 연결)

const PERMISSIONS = {
  dashboard_view: "dashboard.view",
  sessions_view: "sessions.view",
  sessions_create: "sessions.create",
  labeling_access: "labeling.access",
  labeling_edit: "labeling.edit",
  export_download: "export.download",
  leaderboard_view: "leaderboard.view",
  settings_manage: "settings.manage",
};

10.3 페이지별 권한 매핑
페이지	URL	필요 권한
Dashboard	/	dashboard.view
Sessions List	/sessions	sessions.view
Create Session	/sessions	sessions.create
Labeling	/labeling/[sessionId]	labeling.access
Edit/Apply Fix	/labeling/[sessionId]	labeling.edit
Export	/export	export.download
Leaderboard	/leaderboard	leaderboard.view
Settings	/settings	settings.manage
10.4 권한 UX 규칙

권한이 없으면 메뉴 숨김(사이드바 노출 X)

직접 URL 진입 시:

403 화면 + “권한 요청” 버튼

viewer는 라벨링 화면 진입 시 read-only 모드로 자동 전환

O/X, Paint, Apply Fix 버튼 비활성화

11️⃣ 에러 핸들링 / 예외 처리 (현장 UX 필수)

현장(기사님) 환경은 네트워크 불안정 + 실수 입력이 많습니다.
따라서 “에러를 없애는 게 아니라, 에러가 나도 작업이 이어지게” 설계해야 합니다.

11.1 공통 에러 UI 패턴 (ERP 스타일)
Toast 규칙

성공: 우측 하단 2초

경고: 우측 하단 4초 + 액션 버튼(Undo)

실패: 우측 상단 고정 + “재시도/오프라인 저장”

공통 Error Banner
┌───────────────────────────────────────┐
│ ⚠ 저장 실패 (네트워크 불안정)         │
│ [오프라인 저장] [재시도]              │
└───────────────────────────────────────┘

11.2 라벨링 핵심 에러 케이스
A) AI 분석 실패

상태: audio_files.status = error

UI:

“AI 분석 실패” 배지 표시

Manual Mode 버튼 활성화

사용자는 수동으로 라벨링 가능해야 함.

B) 저장 실패 (가장 중요)

모든 변경은 pending_queue에 쌓인다.

복구 규칙:

online 복귀 시 자동 flush

앱 종료 시에도 localStorage 유지

UI:

TopBar: Offline queue: 3

저장 성공하면 queue: 0

C) 대용량 파일 로딩 지연

스펙트로그램 렌더를 chunk로 나눔

“Preview(저해상도)” 먼저 표시 → “Full(고해상도)” 백그라운드 로드

UI:

우측 상단 “HD Loading 40%”

D) 잘못된 구간 선택(실수)

Reject/Apply Fix 직후 3초간 “Undo” 제공

✅ Fix applied  [Undo]

12️⃣ 개발 페이즈 계획 (실제 일정/산출물 기준)

ERP PRD와 동일한 방식:
Phase 1: Frontend First + Dummy/Mock로 확실히 데모를 만든다.

Phase 1 — Frontend First (Mock + Dummy AI) ✅ 데모 핵심

목표: “제조사 앞에서 보여줄 수 있는 수준” 만들기

산출물

/sessions 세션 리스트

세션 생성 모달 + 파일 업로드

/labeling 3패널 UI

스펙트로그램 렌더(정적/미리 생성도 가능)

AI 제안 카드 + O/X

Paint tool(브러시/박스) 기본

Export(JSON/CSV) 버튼

AI는 더미 결과로 충분

“AI가 먼저 찾는 흐름”만 보여주면 됨

Phase 2 — SoundLab 분석 엔진 연동

목표: 진짜 분석 결과를 보여준다

산출물

/ai/analyze-audio FastAPI 연결

Otsu 기반 이상 구간 제안 생성

제안 구간 자동 zoom/jump

저장/로그(Supabase) 연결

Phase 3 — Magnetic Brush + UX 완성도

목표: “대충 칠해도 붙는” 감탄 포인트 구현

산출물

Magnetic v1 (threshold + region grow)

Undo/Redo 안정화

미니맵/구간 탐색 바

모바일/태블릿 대응

Phase 4 — 협업/랭킹/운영 패키지

목표: 실제 사용 운영 가능

산출물

Leaderboard 실시간

사용자/권한 관리

작업 통계(정확도/기여도)

팀 단위 운영 기능

13️⃣ 최종 “앱 진입 → 종료” 플로우 (문서용 정리)

이건 PRD 후반에 붙여두면 아주 좋습니다.

1) 로그인
2) 대시보드
3) 세션 리스트
4) 새 세션 생성 (파일 업로드)
5) AI 분석 자동 실행(더미/실제)
6) 라벨링 화면
   - AI 제안 카드
   - O Confirm / X Reject
   - Reject 시 Edit Mode → Brush/Box → Apply Fix
7) 파일 모두 완료
8) 완료 요약 화면
9) Export 다운로드
10) Leaderboard 확인
11) 종료 (대시보드 복귀)

다음 액션 (선택)

원하면 제가 바로 **PRD.md 스타일로 “완전한 문서 형태”**로 합쳐서,

목차

섹션 번호

코드블록/와이어프레임

표
까지 정리한 단일 PRD 파일로 만들어드릴게요.

원하는 출력 형태만 말해줘요:

“대화창에 전체 PRD 텍스트로”

“PRD.md 파일로 만들어서” (다운로드 링크)

“PRD.md 파일로 만들어서” (다운로드 링크)

PRD 파일을 생성했습니다.
여기서 다운로드하시면 됩니다:

PRD.md 다운로드

원하시면 지금까지 만든 **전체 초상세 PRD 버전(와이어프레임/DB/API 포함 풀버전)**도 파일로 확장해서 만들어드릴게요. 

대화창에 전체 PRD 텍스트로”

좋습니다. 아래는 지금까지 우리가 만든 내용을 하나의 완전한 PRD 문서 형태로 합친 FULL VERSION입니다.
(실제 PRD.md에 그대로 붙여넣기 가능)

Smart Spectro-Tagging
Product Requirements Document (FULL)

Version: 1.0
Status: Frontend-First MVP → AI Integration
Target: 냉동기 제조사 PoC / 데모

1. 프로젝트 개요
1.1 한 줄 정의

AI가 먼저 소리의 이상 구간을 찾아 표시하고
사용자는 “색칠하듯 확인”하는 협업 음향 라벨링 플랫폼.

1.2 해결하려는 문제

현재 제조사/음향 AI 프로젝트의 문제:

음향 데이터 라벨링 비용 매우 높음

전문가 의존도 높음

라벨링 속도 느림

현장 기사 참여 불가능

1.3 목표
구분	목표
기술 목표	AI 협업 음향 라벨링 플랫폼 구축
UX 목표	비전문가도 5분 내 라벨링 가능
데모 목표	냉동기 제조사 기술 시연
사업 목표	AI 음향 진단 SaaS 기반 확보
2. 핵심 컨셉

AI Co-Pilot
→ AI가 먼저 이상 구간 탐지

Tinder 검증 UX
→ O / X 빠른 검증

Magnetic Brush
→ 대충 칠해도 자동 보정

Light Gamification
→ 점수 / 랭킹

3. 기술 스택
Frontend

Next.js

React

Canvas / WebGL

Web Audio API

Backend

FastAPI

Python SoundLab 엔진

Database

Supabase PostgreSQL

4. 시스템 아키텍처
Audio → Python AI Engine → API → React Web App → DB 저장

5. 사용자 전체 여정
로그인
→ 대시보드
→ 세션 생성
→ 파일 업로드
→ AI 분석 자동 실행
→ AI 제안 검증 (O/X)
→ 색칠 수정 (Magnetic Brush)
→ 저장
→ 점수 / 랭킹
→ 종료

6. 주요 화면 설계
6.1 로그인
Smart Spectro-Tagging
[ Email ]
[ Password ]
[ Login ]

6.2 대시보드
오늘 점수 120
처리 파일 18개

[ 새 라벨링 시작 ]
최근 파일 리스트

6.3 세션 리스트 (/sessions)
Session ID | 파일수 | 진행률 | 점수 | 상태
S-001      | 18     | 35%    | 120 | 진행중

[ 새 세션 생성 ]

6.4 세션 생성 모달
세션 이름
장비 유형 (compressor/fan/pump)
샘플링레이트

파일 업로드
[ 생성 ]

7. 핵심 화면 — 라벨링 세션
7.1 3 Panel Workspace
Files | Spectrogram Canvas | AI Panel

7.2 AI 제안 패널
Label: Bearing wear
Confidence: 82%

[ O Confirm ] [ X Reject ]

Confirm

점수 +10

다음 제안 이동

Reject

Edit Mode 진입

7.3 Edit Mode

툴바 활성화

[ Brush ] [ Eraser ] [ Box ]
[ Undo ] [ Redo ]


사용자 색칠 → Magnetic Brush 자동 보정

Apply Fix → 점수 +20

7.4 라벨링 완료
정확도 92%
획득 점수 +140
[ 결과 저장 ]

7.5 리더보드
1 Alex 540
2 Kim 420
3 You 380

8. Magnetic Brush 알고리즘
목표

사용자는 대충 칠함
시스템은 정확한 영역 자동 생성

MVP 알고리즘

사용자가 칠한 영역 수집

주변 스펙트럼 강도 분석

자동 threshold 적용

영역 확장 (region grow)

최종 polygon 생성

9. 데이터베이스 설계
users

id

email

role

sessions

id

name

device_type

status

audio_files

id

session_id

duration

ai_suggestions

label

confidence

start_time

end_time

annotations

source (AI / USER / CORRECTED)

geometry JSON

session_scores

confirm_count

fix_count

score

action_logs

action

payload

10. 상태관리
Global Stores
Session Store

currentSession

currentAudio

autosave

Annotation Store

aiSuggestions

userAnnotations

mode(review/edit)

Score Store

score

streak

11. API 설계
Sessions

POST /sessions/create
GET /sessions

Audio

POST /audio/upload

AI

POST /ai/analyze-audio
GET /ai/suggestions/{audioId}

Labeling

POST /annotations/save
POST /suggestions/confirm
POST /suggestions/reject

Leaderboard

GET /leaderboard

12. 권한 체계
Role	권한
admin	전체
annotator	라벨링
viewer	조회
13. 에러 처리
저장 실패

→ Offline Queue 저장 → 자동 재전송

AI 실패

→ Manual Mode 전환

Undo 기능

→ Reject/Apply 후 3초 Undo 제공

14. 개발 페이즈
Phase 1 — Frontend First (데모)

UI 완성

Dummy AI

Export 기능

Phase 2 — AI 연동

SoundLab 연결

자동 이상 탐지

Phase 3 — Magnetic Brush

자동 영역 보정

Phase 4 — 협업/운영

랭킹

권한

통계

15. 최종 사용자 흐름
Login
→ Dashboard
→ Sessions
→ Upload Audio
→ AI Analyze
→ Confirm / Reject
→ Paint Fix
→ Save
→ Leaderboard
→ Exit

END OF PRD 🚀

원하면 다음 단계로
👉 UI 디자인 시안 / Figma용 구조도 이어서 만들어드릴 수 있습니다.

진행

좋습니다 🔥
이제 PRD 다음 단계 = Figma 제작용 UI 설계 문서 단계입니다.
(여기부터는 디자이너/프론트가 바로 작업 가능한 수준)

지금부터 만드는 것은
👉 Design Spec + Figma Frame 구조 문서

Smart Spectro-Tagging
UI Design Specification (Figma 준비 문서)

목표

디자이너가 그대로 Figma 프레임 생성 가능

컴포넌트 단위로 디자인 가능

반응형까지 포함

1️⃣ 디자인 시스템 기초
1.1 디자인 키워드
키워드	의미
Industrial	제조/엔지니어 느낌
Scientific	분석 툴 느낌
Minimal	복잡한 기능을 단순하게
High Contrast	스펙트로그램 가독성

참고 제품 감성

Figma Dev Mode

Adobe Audition

Linear App

Vercel Dashboard

👉 “엔지니어용 SaaS 느낌”

1.2 Color Palette
Primary
역할	색상
Primary	#4F7CFF
Accent	#22C55E
Danger	#EF4444
Warning	#F59E0B
Spectrogram Background
영역	색상
Canvas bg	#0B1020
Panel bg	#111827
Border	#1F2937

👉 다크 테마 기본

1.3 Typography
용도	폰트	크기
Title	Inter Bold	24px
Section	Inter Semi	18px
Body	Inter	14px
Small	Inter	12px
2️⃣ Figma 파일 구조

디자이너에게 그대로 전달할 구조 👇

📁 Smart Spectro Tagging
   📁 00 Foundations
   📁 01 Components
   📁 02 Pages
   📁 03 Responsive

3️⃣ Components Library

이 섹션 = Figma 컴포넌트 페이지

3.1 Buttons
Primary Button
[ Confirm ]
bg: Primary
radius: 8px
height: 40px

Danger Button
[ Reject ]
bg: Red

3.2 AI Suggestion Card
┌────────────────────┐
 Bearing Wear
 Confidence 82%
 Time 00:12~00:14
└────────────────────┘


Variants:

Pending

Confirmed

Rejected

3.3 Toolbar
[ Brush ] [ Eraser ] [ Box ] [ Undo ] [ Redo ]


Icon + Label style.

3.4 File List Item
▶ compressor.wav
Analyzed ✓


States:

Active

Hover

Completed

4️⃣ Pages — Figma Frames

이제 페이지별 Frame 구조.

4.1 Login Page Frame

Frame name: Page/Login

Logo
Email input
Password input
Login button
Google login


Frame size:
Desktop 1440×900

4.2 Dashboard Frame

Frame name: Page/Dashboard

Sections:

Today Score Card

Files Processed Card

Start Labeling CTA

Recent Files List

4.3 Sessions List Frame

Frame name: Page/Sessions

Components:

Search Bar

Filters

Data Table

Create Session Button

4.4 Labeling Workspace Frame ⭐ 핵심

Frame name: Page/Labeling

Grid: 3 columns

영역	폭
File Panel	280px
Canvas	Flexible
AI Panel	320px
Canvas Area

큰 프레임:

SpectrogramCanvas
Toolbar
Audio Player

AI Panel
AI Suggestion Card
Confirm / Reject Buttons
Edit Mode Panel

4.5 Session Complete Frame
🎉 Completed
Accuracy %
Score
Export Button
Leaderboard Button

4.6 Leaderboard Frame

Table:
Rank | User | Today | All time

5️⃣ 반응형 설계
Tablet (1024px)

File panel → collapsible

AI panel → slide panel

Mobile (future)

Step-by-step wizard UI

🎉 이제 상태

우리는 지금:

PRD ✔
UX ✔
DB ✔
API ✔
UI Design Spec ✔

다음 단계 선택 가능:

1️⃣ Figma 와이어프레임 ASCII 버전
2️⃣ React 컴포넌트 구조 설계
3️⃣ 실제 Next.js 폴더 구조 생성

추천: 👉 React 컴포넌트 구조 설계가 다음 단계 👍

ㄱ

좋습니다. 이제 React/Next.js 컴포넌트 구조 설계로 갑니다.
ERP PRD처럼 폴더 구조 + 컴포넌트 책임 + Props + 상태/훅까지 “바로 개발 가능한 수준”으로 정리합니다.

React/Next.js 컴포넌트 아키텍처 (Dev Spec)
0. 목표

Frontend First(더미 AI/Mock)로 데모 완성

추후 FastAPI/Supabase 붙여도 구조 안 깨지게 설계

1. 디렉토리 구조 (Next.js App Router 기준)
sst/
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + TopBar
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── sessions/page.tsx       # Sessions list
│   │   │   ├── sessions/[id]/page.tsx  # Session detail (optional)
│   │   │   ├── labeling/[id]/page.tsx  # Labeling workspace
│   │   │   ├── leaderboard/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/                        # (Phase2) route handlers
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── page-wrapper.tsx
│   │   ├── common/
│   │   │   ├── data-table.tsx
│   │   │   ├── search-bar.tsx
│   │   │   ├── filter-tabs.tsx
│   │   │   ├── modal.tsx
│   │   │   └── toast.tsx
│   │   └── domain/
│   │       ├── dashboard/
│   │       ├── sessions/
│   │       ├── labeling/
│   │       ├── leaderboard/
│   │       └── settings/
│   ├── lib/
│   │   ├── store/                      # Zustand
│   │   │   ├── auth-store.ts
│   │   │   ├── session-store.ts
│   │   │   ├── annotation-store.ts
│   │   │   ├── score-store.ts
│   │   │   └── ui-store.ts
│   │   ├── hooks/
│   │   │   ├── use-hotkeys.ts
│   │   │   ├── use-audio-player.ts
│   │   │   ├── use-spectrogram.ts
│   │   │   ├── use-canvas-draw.ts
│   │   │   ├── use-magnetic-brush.ts
│   │   │   └── use-autosave.ts
│   │   ├── mock/
│   │   │   ├── sessions.ts
│   │   │   ├── audio-files.ts
│   │   │   ├── suggestions.ts
│   │   │   ├── annotations.ts
│   │   │   └── leaderboard.ts
│   │   ├── api/
│   │   │   ├── client.ts               # fetch wrapper
│   │   │   └── endpoints.ts            # path constants
│   │   └── utils/
│   │       ├── format.ts
│   │       ├── time.ts
│   │       ├── geometry.ts             # polygon simplify, bbox
│   │       └── spectro.ts              # scale/normalize helpers
│   └── types/
│       ├── session.ts
│       ├── audio.ts
│       ├── suggestion.ts
│       ├── annotation.ts
│       ├── score.ts
│       └── common.ts
└── package.json

2. 도메인별 컴포넌트 설계
2.1 Sessions
SessionsPage

세션 목록 로드(Phase1: mock)

탭 필터(전체/진행/완료)

“새 세션 생성” 모달 호출

구성:

SessionsHeader

SessionsTable

CreateSessionModal

CreateSessionModal

책임

세션 메타 입력

파일 업로드(프론트에선 File 객체 유지)

생성 후 /labeling/{id}로 이동

Props:

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

2.2 Labeling (핵심)
LabelingWorkspacePage

라우트 진입 시 세션 로드

global hotkeys 등록

autosave hook 연결

전체 3패널 렌더

구성:

WorkspaceTopBar

FileQueuePanel

SpectrogramPanel

AISidePanel

WorkspaceFooter

FileQueuePanel

책임

파일 리스트/진행상태

파일 클릭 → 현재 작업 저장 → 파일 전환

이벤트 로그 클릭 → 캔버스 점프

Props:

interface FileQueuePanelProps {
  files: AudioFileMeta[];
  currentFileId: string;
  onSelectFile: (fileId: string) => void;
  onJumpTo: (t: number) => void;
}

SpectrogramPanel

책임

Canvas 렌더 영역 + Toolbar + Player

캔버스 모드 전환(review/edit)

선택/드로잉 이벤트를 store에 반영

구성:

SpectrogramCanvas

CanvasToolbar

AudioPlayerBar

MiniMap (optional)

SpectrogramCanvas

책임 (중요)

5 레이어 렌더

스펙트로그램 heatmap

AI mask overlay

User overlay

Selection overlay

Cursor overlay

Props:

interface SpectrogramCanvasProps {
  spectroImage: ImageBitmap | HTMLCanvasElement; // Phase1: pre-render
  suggestions: Suggestion[];
  annotations: Annotation[];
  mode: 'review' | 'edit';
  tool: 'brush' | 'eraser' | 'box' | 'select';
  snapEnabled: boolean;
  playheadTime: number;
  onSelectSuggestion: (id: string) => void;
  onCreateAnnotation: (draft: AnnotationDraft) => void;
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
}

CanvasToolbar

책임

tool 선택

undo/redo

snap 토글

zoom/pan 모드 표시

Props:

interface CanvasToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  snapEnabled: boolean;
  toggleSnap: () => void;
}

AISidePanel

책임

현재 suggestion 카드 표시

O/X 액션

reject 시 Edit Mode Panel 노출

구성:

SuggestionCard

ConfirmRejectButtons

EditModePanel

EditModePanel

책임

Reject 이유 선택

라벨 변경 picker

“Apply Fix” 강제 안내

Props:

interface EditModePanelProps {
  rejectReason: RejectReason;
  setRejectReason: (r: RejectReason) => void;
  label: string;
  setLabel: (l: string) => void;
  onApplyFix: () => void;
  onCancel: () => void;
}

3. Zustand Store 설계 (핵심)
3.1 session-store
currentSession
files[]
currentFileId
setCurrentFile()

3.2 annotation-store
mode (review/edit)
tool
snapEnabled
suggestions[]
annotations[]
selectedSuggestionId

confirmSuggestion(id)
rejectSuggestion(id)
applyFix(annotationDraft)
undo/redo stacks

3.3 score-store
score
streak
addScore(type)

3.4 ui-store
modals (create session)
toasts
loading states
offline queue count

4. Hooks 설계
use-hotkeys

O/X Confirm/Reject

B/E/R tool 변경

Ctrl+Z undo

use-spectrogram

오디오 → FFT → 스펙트로그램 이미지 생성(Phase2)

Phase1: prebuilt 이미지 로드

use-canvas-draw

pointer events 통합 처리

brush stroke → draft mask 생성

use-magnetic-brush

stroke 주변 intensity 맵 기반 자동 보정

v1: threshold + region grow

v2: contour + simplify

use-autosave

store 변화 감지

3초 idle 후 save() 실행

offline queue 처리

5. Phase 1 (Frontend First) 구현 우선순위

Sessions list + Create Modal

Labeling 3-panel layout

SpectrogramCanvas (이미지 + 박스 마스크)

SuggestionCard + O/X confirm/reject

Brush/Box annotation 저장

Export(JSON/CSV)

Leaderboard mock

다음 액션

원하면 이제 **“바로 개발 시작 가능한 초기 스캐폴딩 파일(빈 컴포넌트/스토어/라우팅)”**을
폴더 구조 그대로 만들어서 코드 템플릿까지 작성해드릴게요.

원하시는 방향은 둘 중 뭐로 갈까요?

코드 스캐폴딩(Next.js 초기 코드 뼈대) 생성

Canvas 구현 상세(스펙트로그램 렌더/오버레이/드로잉 이벤트) 초상세 설계

뭐가좋을까

둘 다 결국 해야 하는데, **지금 목표가 “냉동기 제조사 데모”**라면 순서가 중요해요.

추천 순서(데모 최단거리)
1) 코드 스캐폴딩(Next.js 뼈대) 먼저 ✅

이유: “앱이 돌아가는 형태”를 빨리 만들 수 있음

세션/라우팅/레이아웃/스토어/모달까지 잡아두면, 이후 기능을 꽂아 넣기만 하면 됨

팀/외주/협업할 때도 구조가 먼저 있어야 커뮤니케이션이 쉬움

2) 그 다음에 Canvas 구현 상세 ✅

이유: 캔버스는 난이도 높고 시간이 잡아먹힘

그런데 스캐폴딩이 없으면 캔버스 작업물이 앱에 붙지 못함

먼저 “라벨링 화면 틀(3패널)”을 만들고, 캔버스를 그 안에 끼우는 게 가장 안정적

언제 Canvas부터 가는 게 더 좋은가?

딱 한 가지 경우예요.

“마그네틱 브러시 데모”가 가장 중요한 세일즈 포인트라서
캔버스 프로토타입만으로도 투자/발주가 나온다
이런 상황이면 캔버스 POC를 먼저 만들어도 됩니다.

하지만 지금은 제조사에게 ‘AI가 먼저 찾고, 현장은 OX/색칠로 끝’ 흐름을 보여주는 게 핵심이라
👉 전체 앱이 돌아가는 게 더 설득력 커요.

결론

지금은 1) 코드 스캐폴딩부터 가는 게 제일 좋습니다.

원하면 제가 다음 메시지에서 바로:

Next.js(App Router) 라우팅

Sidebar/Topbar 레이아웃

Sessions 페이지 + Create Modal

Labeling 페이지(3패널)

Zustand 스토어 기본

Mock 데이터 연결

까지 “복붙해서 실행되는 수준”으로 템플릿을 쭉 드릴게요.

그대로 진행할게요?

ㄱ

좋아요. 바로 실행되는 Next.js(App Router) 스캐폴딩을 “복붙용”으로 드릴게요.
(Phase 1: Mock + Dummy AI 기준, 3패널 라벨링 화면까지 뜨는 상태)

아래 순서대로 파일 만들면 됩니다.

0) 프로젝트 생성 & 패키지
npx create-next-app@latest sst --ts --app --eslint
cd sst

# 스타일(간단 버전): Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 상태관리
npm i zustand

# 아이콘(선택)
npm i lucide-react

tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;

src/app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  background: #0b1020;
  color: white;
}

1) 라우팅 구조

아래 파일/폴더 생성:

src/app/
  (auth)/login/page.tsx
  (dashboard)/layout.tsx
  (dashboard)/page.tsx
  (dashboard)/sessions/page.tsx
  (dashboard)/labeling/[id]/page.tsx
  (dashboard)/leaderboard/page.tsx

2) 레이아웃 컴포넌트
src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/sessions", label: "Sessions" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] border-r border-white/10 p-4">
      <div className="text-lg font-semibold mb-6">Smart Spectro-Tagging</div>
      <nav className="space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`block rounded px-3 py-2 text-sm ${
                active ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

src/components/layout/topbar.tsx
"use client";

export function TopBar() {
  return (
    <header className="h-14 border-b border-white/10 flex items-center px-4 justify-between">
      <div className="text-sm opacity-80">Frontend-First Demo</div>
      <div className="text-sm">User: Kim</div>
    </header>
  );
}

src/components/layout/page-wrapper.tsx
import { ReactNode } from "react";

export function PageWrapper({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}

src/app/(dashboard)/layout.tsx
import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

3) Mock 데이터
src/lib/mock/sessions.ts
export type SessionStatus = "ready" | "analyzing" | "labeling" | "completed";

export type Session = {
  id: string;
  name: string;
  deviceType: string;
  fileCount: number;
  progressPct: number;
  score: number;
  status: SessionStatus;
  createdAt: string;
};

export const mockSessions: Session[] = [
  {
    id: "S-001",
    name: "Compressor Demo Set",
    deviceType: "compressor",
    fileCount: 18,
    progressPct: 35,
    score: 120,
    status: "labeling",
    createdAt: "2026-02-10",
  },
  {
    id: "S-002",
    name: "Fan Noise Batch",
    deviceType: "fan",
    fileCount: 24,
    progressPct: 100,
    score: 380,
    status: "completed",
    createdAt: "2026-02-09",
  },
];

src/lib/mock/labeling.ts
export type AudioFileMeta = {
  id: string;
  fileName: string;
  durationSec: number;
  sampleRate: number;
  status: "pending" | "analyzed" | "labeled";
};

export type Suggestion = {
  id: string;
  label: string;
  confidence: number;
  startTime: number;
  endTime: number;
  freqLow: number;
  freqHigh: number;
  status: "pending" | "confirmed" | "rejected";
};

export const mockFiles: AudioFileMeta[] = [
  { id: "A", fileName: "compressor_01.wav", durationSec: 32, sampleRate: 16000, status: "analyzed" },
  { id: "B", fileName: "compressor_02.wav", durationSec: 28, sampleRate: 16000, status: "pending" },
  { id: "C", fileName: "fan_01.wav", durationSec: 41, sampleRate: 16000, status: "pending" },
];

export const mockSuggestions: Suggestion[] = [
  {
    id: "SG-1",
    label: "Bearing Wear",
    confidence: 0.82,
    startTime: 12,
    endTime: 14,
    freqLow: 110,
    freqHigh: 140,
    status: "pending",
  },
  {
    id: "SG-2",
    label: "Compressor Rattle",
    confidence: 0.71,
    startTime: 18,
    endTime: 20,
    freqLow: 250,
    freqHigh: 310,
    status: "pending",
  },
];

4) Zustand 스토어(최소)
src/lib/store/annotation-store.ts
import { create } from "zustand";
import type { Suggestion } from "@/lib/mock/labeling";
import { mockSuggestions } from "@/lib/mock/labeling";

type Mode = "review" | "edit";

type AnnotationState = {
  mode: Mode;
  suggestions: Suggestion[];
  currentSuggestionId: string | null;
  score: number;
  streak: number;

  setMode: (m: Mode) => void;
  setCurrentSuggestion: (id: string) => void;
  confirm: () => void;
  reject: () => void;
  applyFix: () => void;
};

function nextSuggestionId(suggestions: Suggestion[], currentId: string | null): string | null {
  if (!suggestions.length) return null;
  if (!currentId) return suggestions[0].id;
  const idx = suggestions.findIndex((s) => s.id === currentId);
  const next = suggestions[idx + 1];
  return next ? next.id : null;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  mode: "review",
  suggestions: mockSuggestions,
  currentSuggestionId: mockSuggestions[0]?.id ?? null,
  score: 0,
  streak: 0,

  setMode: (m) => set({ mode: m }),
  setCurrentSuggestion: (id) => set({ currentSuggestionId: id }),

  confirm: () => {
    const { suggestions, currentSuggestionId, score, streak } = get();
    if (!currentSuggestionId) return;
    set({
      suggestions: suggestions.map((s) =>
        s.id === currentSuggestionId ? { ...s, status: "confirmed" } : s
      ),
      score: score + 10,
      streak: streak + 1,
      mode: "review",
      currentSuggestionId: nextSuggestionId(suggestions, currentSuggestionId),
    });
  },

  reject: () => {
    const { suggestions, currentSuggestionId } = get();
    if (!currentSuggestionId) return;
    set({
      suggestions: suggestions.map((s) =>
        s.id === currentSuggestionId ? { ...s, status: "rejected" } : s
      ),
      mode: "edit",
    });
  },

  applyFix: () => {
    const { score, mode } = get();
    if (mode !== "edit") return;
    // 실제로는 annotation 저장 + AI rejected 유지
    set((st) => ({
      score: st.score + 20,
      mode: "review",
      currentSuggestionId: nextSuggestionId(st.suggestions, st.currentSuggestionId),
    }));
  },
}));

5) Sessions 페이지 + Create Modal (UI 최소)
src/components/domain/sessions/create-session-modal.tsx
"use client";

import { useState } from "react";

export function CreateSessionModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}) {
  const [name, setName] = useState("Demo Session");
  const [deviceType, setDeviceType] = useState("compressor");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-[#111827] p-4">
        <div className="text-lg font-semibold mb-3">새 라벨링 세션 생성</div>

        <div className="space-y-3">
          <label className="block">
            <div className="text-xs opacity-80 mb-1">세션 이름</div>
            <input
              className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-xs opacity-80 mb-1">장비 유형</div>
            <select
              className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
            >
              <option value="compressor">compressor</option>
              <option value="fan">fan</option>
              <option value="pump">pump</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs opacity-80 mb-1">오디오 파일 업로드(데모는 생략 가능)</div>
            <input type="file" multiple className="text-sm" />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded border border-white/10 hover:bg-white/5 text-sm"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 text-sm"
            onClick={() => {
              // 데모: 즉시 sessionId 생성
              const sessionId = `S-DEMO-${Date.now()}`;
              onCreated(sessionId);
              onClose();
            }}
          >
            생성하기
          </button>
        </div>

        <div className="mt-3 text-xs opacity-60">
          (데모용) name: {name}, device: {deviceType}
        </div>
      </div>
    </div>
  );
}

src/app/(dashboard)/sessions/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { mockSessions } from "@/lib/mock/sessions";
import { CreateSessionModal } from "@/components/domain/sessions/create-session-modal";

export default function SessionsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "labeling" | "completed">("all");
  const [open, setOpen] = useState(false);

  const data = useMemo(() => {
    if (tab === "all") return mockSessions;
    if (tab === "labeling") return mockSessions.filter((s) => s.status === "labeling");
    return mockSessions.filter((s) => s.status === "completed");
  }, [tab]);

  return (
    <PageWrapper title="Sessions">
      <div className="flex items-center gap-2 mb-3">
        {[
          ["all", "전체"],
          ["labeling", "진행중"],
          ["completed", "완료"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className={`px-3 py-1 rounded text-sm border border-white/10 ${
              tab === k ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 text-sm"
        >
          새 세션 생성
        </button>
      </div>

      <div className="border border-white/10 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-left">
              <th className="p-3">Session ID</th>
              <th className="p-3">Files</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Score</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr
                key={s.id}
                className="border-t border-white/10 hover:bg-white/5 cursor-pointer"
                onClick={() => router.push(`/labeling/${s.id}`)}
              >
                <td className="p-3">{s.id}</td>
                <td className="p-3">{s.fileCount}</td>
                <td className="p-3">{s.progressPct}%</td>
                <td className="p-3">{s.score}</td>
                <td className="p-3">{s.status}</td>
                <td className="p-3">{s.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateSessionModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(sessionId) => router.push(`/labeling/${sessionId}`)}
      />
    </PageWrapper>
  );
}

6) Dashboard / Leaderboard / Login (최소)
src/app/(dashboard)/page.tsx
import { PageWrapper } from "@/components/layout/page-wrapper";

export default function DashboardPage() {
  return (
    <PageWrapper title="Dashboard">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">오늘 점수</div>
          <div className="text-2xl font-semibold mt-1">120</div>
        </div>
        <div className="rounded border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">처리 파일</div>
          <div className="text-2xl font-semibold mt-1">18</div>
        </div>
        <div className="rounded border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">상태</div>
          <div className="text-2xl font-semibold mt-1">Demo</div>
        </div>
      </div>
    </PageWrapper>
  );
}

src/app/(dashboard)/leaderboard/page.tsx
import { PageWrapper } from "@/components/layout/page-wrapper";

const rows = [
  { rank: 1, user: "Alex", today: 540, all: 4210 },
  { rank: 2, user: "Kim", today: 420, all: 3500 },
  { rank: 3, user: "You", today: 380, all: 380 },
];

export default function LeaderboardPage() {
  return (
    <PageWrapper title="Leaderboard">
      <div className="border border-white/10 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-left">
              <th className="p-3">Rank</th>
              <th className="p-3">User</th>
              <th className="p-3">Today</th>
              <th className="p-3">All Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} className="border-t border-white/10">
                <td className="p-3">{r.rank}</td>
                <td className="p-3">{r.user}</td>
                <td className="p-3">{r.today}</td>
                <td className="p-3">{r.all}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}

src/app/(auth)/login/page.tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded border border-white/10 bg-[#111827] p-5">
        <div className="text-lg font-semibold mb-4">Login</div>
        <div className="space-y-3">
          <input className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm" placeholder="Email" />
          <input className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm" placeholder="Password" type="password" />
          <button className="w-full px-3 py-2 rounded bg-white/10 hover:bg-white/15 text-sm">
            Login (Demo)
          </button>
        </div>
      </div>
    </div>
  );
}

7) 라벨링 페이지(3패널) + O/X 동작
src/components/domain/labeling/file-queue-panel.tsx
"use client";

import type { AudioFileMeta } from "@/lib/mock/labeling";

export function FileQueuePanel({
  files,
  currentFileId,
  onSelectFile,
}: {
  files: AudioFileMeta[];
  currentFileId: string;
  onSelectFile: (id: string) => void;
}) {
  return (
    <div className="w-[280px] border-r border-white/10 p-3">
      <div className="text-sm font-semibold mb-3">Files</div>
      <div className="space-y-1">
        {files.map((f) => {
          const active = f.id === currentFileId;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFile(f.id)}
              className={`w-full text-left rounded px-2 py-2 text-sm border border-transparent ${
                active ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{active ? "▶ " : ""}{f.fileName}</span>
                <span className="text-xs opacity-60">{f.status}</span>
              </div>
              <div className="text-xs opacity-60">
                {f.durationSec}s · {f.sampleRate}Hz
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

src/components/domain/labeling/spectrogram-panel.tsx
"use client";

export function SpectrogramPanel() {
  // Phase1: 스펙트로그램은 이미지/캔버스 대체(임시)
  return (
    <div className="flex-1 p-3">
      <div className="rounded border border-white/10 bg-white/5 h-[520px] flex items-center justify-center">
        <div className="text-sm opacity-70">
          SpectrogramCanvas (Phase1 Placeholder)
          <div className="text-xs opacity-60 mt-2">
            다음 단계에서 Canvas + Overlay + Drawing 붙입니다.
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="text-xs opacity-70">Toolbar:</div>
        {["Brush", "Eraser", "Box", "Undo", "Redo", "Snap:ON"].map((t) => (
          <span key={t} className="px-2 py-1 text-xs rounded bg-white/10 border border-white/10">
            {t}
          </span>
        ))}
        <div className="flex-1" />
        <div className="text-xs opacity-70">Player: 00:12 / 00:32</div>
      </div>
    </div>
  );
}

src/components/domain/labeling/ai-side-panel.tsx
"use client";

import { useAnnotationStore } from "@/lib/store/annotation-store";

export function AISidePanel() {
  const { suggestions, currentSuggestionId, mode, score, streak, confirm, reject, applyFix } =
    useAnnotationStore();

  const current = suggestions.find((s) => s.id === currentSuggestionId) ?? null;

  return (
    <div className="w-[320px] border-l border-white/10 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">AI Suggestion</div>
        <div className="text-xs opacity-70">Score {score} · Streak {streak}</div>
      </div>

      {!current ? (
        <div className="rounded border border-white/10 bg-white/5 p-3 text-sm opacity-80">
          모든 제안 처리가 끝났습니다.
        </div>
      ) : (
        <div className="rounded border border-white/10 bg-white/5 p-3">
          <div className="text-sm font-semibold">{current.label}</div>
          <div className="text-xs opacity-70 mt-1">
            Conf {(current.confidence * 100).toFixed(0)}%
          </div>
          <div className="text-xs opacity-70 mt-1">
            Time {current.startTime}s ~ {current.endTime}s
          </div>
          <div className="text-xs opacity-70 mt-1">
            Band {current.freqLow} ~ {current.freqHigh} Hz
          </div>
          <div className="text-xs opacity-60 mt-2">Status: {current.status}</div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 text-sm disabled:opacity-40"
          disabled={!current || mode !== "review"}
          onClick={confirm}
          title="O"
        >
          O Confirm
        </button>
        <button
          className="px-3 py-2 rounded bg-red-500/20 hover:bg-red-500/30 text-sm disabled:opacity-40"
          disabled={!current || mode !== "review"}
          onClick={reject}
          title="X"
        >
          X Reject
        </button>
      </div>

      {mode === "edit" && (
        <div className="mt-4 rounded border border-yellow-500/20 bg-yellow-500/10 p-3">
          <div className="text-sm font-semibold">Edit Mode</div>
          <div className="text-xs opacity-70 mt-1">
            브러시/박스로 수정 후 Apply Fix를 누르세요.
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="px-3 py-2 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-sm"
              onClick={applyFix}
            >
              Apply Fix (+20)
            </button>
            <button
              className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 text-sm"
              onClick={() => useAnnotationStore.getState().setMode("review")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs opacity-60">
        단축키는 다음 단계에서 연결: O / X / B / E / R
      </div>
    </div>
  );
}

src/app/(dashboard)/labeling/[id]/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileQueuePanel } from "@/components/domain/labeling/file-queue-panel";
import { SpectrogramPanel } from "@/components/domain/labeling/spectrogram-panel";
import { AISidePanel } from "@/components/domain/labeling/ai-side-panel";
import { mockFiles } from "@/lib/mock/labeling";

export default function LabelingPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const files = useMemo(() => mockFiles, []);
  const [currentFileId, setCurrentFileId] = useState(files[0]?.id ?? "A");

  return (
    <div className="h-[calc(100vh-56px)] flex">
      <FileQueuePanel files={files} currentFileId={currentFileId} onSelectFile={setCurrentFileId} />
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b border-white/10 text-sm opacity-80">
          Session: {sessionId} · File: {currentFileId}
        </div>
        <div className="flex-1 flex">
          <SpectrogramPanel />
          <AISidePanel />
        </div>
        <div className="h-10 border-t border-white/10 px-4 flex items-center text-xs opacity-70">
          Progress 1/3 · Suggestions (mock) · Export (todo) · Help (todo)
        </div>
      </div>
    </div>
  );
}

8) 실행
npm run dev


http://localhost:3000 → Dashboard

/sessions → 세션 목록

세션 클릭 → /labeling/S-001 → 3패널 + O/X + EditMode까지 동작

다음 단계(선택)

이제 “앱 뼈대”는 끝났습니다 ✅
다음은 데모 퀄리티를 올리는 우선순위 3개 중 하나로 가면 됩니다:

단축키(O/X/B/E/R + Undo/Redo) 연결 (1~2시간급)

SpectrogramCanvas 실제 Canvas 구현 + AI 마스크 박스 오버레이 (핵심 데모)

Brush 그리기 입력 + Magnetic Brush v1(간단 보정)

원하는 다음 타겟을 1/2/3으로 골라주면, 그걸 “바로 붙여서 동작하게” 코드로 이어서 드릴게요.