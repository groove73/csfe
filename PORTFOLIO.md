# Charging Station Information System Portfolio
# 충전소 정보 시스템 포트폴리오

## 1. Project Overview (프로젝트 개요)

**English**
The Charging Station Information System is a comprehensive full-stack application designed to help electric vehicle (EV) users locate charging stations and view real-time status. It features a modern, responsive frontend and a robust, scalable backend architecture.

**Korean**
충전소 정보 시스템은 전기차(EV) 사용자가 충전소를 찾고 실시간 상태를 확인할 수 있도록 돕는 풀스택 애플리케이션입니다. 현대적이고 반응형인 프론트엔드와 견고하고 확장 가능한 백엔드 아키텍처를 특징으로 합니다.

---

## 2. Technical Stack (기술 스택)

### Backend (CSBE)
- **Language**: Java 21
- **Framework**: Spring Boot 3.2.1
- **Build Tool**: Gradle
- **Database**: PostgreSQL (JPA/Hibernate)
- **Security**: Spring Security (OAuth2 Resource Server), JJWT
- **Architecture**: Hexagonal Architecture (Ports and Adapters)
- **External Integration**: Open Data Portal API (Charging Station Info)

### Frontend (CSFE)
- **Framework**: Next.js 16.1.1 (App Router)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI (Headless UI components)
- **Authentication**: Supabase Auth (Google OAuth 2.0)
- **Backend Service**: Supabase (Database & Auth)
- **Map Integration**: Kakao Map API

---

## 3. Key Features (핵심 기능)

**English**
1.  **Station Search & Map Visualization**:
    - Interactive map using Kakao Map API.
    - Search stations by region or name (fuzzy search/autocomplete).
    - Clusters and markers for station locations.
2.  **Real-Time Status Monitoring**:
    - Live updates on charger availability (Available, Charging, Broken).
    - Detailed charger information: Connector type (DC Combo, CHAdeMO, AC3), power output (kW), and parking fees.
    - Auto-refresh mechanism (1-minute interval) for status updates.
3.  **Authentication & Access Control**:
    - **Google Login**: Seamless sign-in experience using Supabase Auth.
    - **Guest Mode**: Limited access for non-logged-in users (e.g., 5 searches/minute rate limit based on temporary token).
    - **Role-Based Access**: Differing capabilities for guests vs. authenticated users.
4.  **Responsive Design**:
    - Fully responsive UI optimized for both desktop and mobile devices.
    - Modern aesthetic with clean typography and intuitive navigation.

**Korean**
1.  **충전소 검색 및 지도 시각화**:
    - 카카오맵 API를 활용한 대화형 지도 인터페이스.
    - 지역 또는 충전소 명칭으로 검색 (유사 검색/자동 완성 지원).
    - 충전소 위치 마커 및 클러스터링 제공.
2.  **실시간 상태 모니터링**:
    - 충전기 가용 상태 실시간 업데이트 (사용 가능, 충전 중, 고장 등).
    - 상세 충전기 정보 제공: 충전 타입(DC콤보, 차데모, AC3상), 출력량(kW), 주차 요금 등.
    - 1분 간격의 상태 자동 갱신 기능.
3.  **인증 및 접근 제어**:
    - **구글 로그인**: Supabase Auth를 이용한 간편 로그인.
    - **게스트 모드**: 비로그인 사용자를 위한 제한적 접근 (예: 임시 토큰 기반 분당 5회 조회 제한).
    - **권한 기반 접근**: 게스트와 인증된 사용자 간의 기능 차별화.
4.  **반응형 디자인**:
    - 데스크톱과 모바일 기기 모두에 최적화된 완전 반응형 UI.
    - 깔끔한 타이포그래피와 직관적인 내비게이션을 갖춘 현대적인 디자인.

---

## 4. Architecture Highlights (아키텍처 특징)

**English**
- **Hexagonal Architecture (Backend)**:
  - The backend strictly follows the Hexagonal (Ports & Adapters) architecture.
  - **Core Domain**: Pure Java logic, isolated from frameworks.
  - **Inbound Adapters**: Web controllers (`adapter.in.web`) handling HTTP requests.
  - **Outbound Adapters**: External API clients (`adapter.out.external`) communicating with government data portals.
  - **Ports**: Interfaces defining the boundaries (`application.port.in`, `application.port.out`).
- **Server-Side Rendering & Client Components (Frontend)**:
  - Leverages Next.js App Router for optimal performance.
  - Use of Server Components for initial data load and Client Components for interactive map features.

**Korean**
- **헥사고날 아키텍처 (백엔드)**:
  - 백엔드는 헥사고날(포트 & 어댑터) 아키텍처를 철저히 준수합니다.
  - **핵심 도메인**: 프레임워크와 분리된 순수 Java 비즈니스 로직.
  - **인바운드 어댑터**: HTTP 요청을 처리하는 웹 컨트롤러 (`adapter.in.web`).
  - **아웃바운드 어댑터**: 공공 데이터 포털과 통신하는 외부 API 클라이언트 (`adapter.out.external`).
  - **포트**: 경계를 정의하는 인터페이스 (`application.port.in`, `application.port.out`).
- **서버 사이드 렌더링 및 클라이언트 컴포넌트 (프론트엔드)**:
  - 최적의 성능을 위해 Next.js App Router를 활용합니다.
  - 초기 데이터 로드를 위한 서버 컴포넌트와 대화형 지도 기능을 위한 클라이언트 컴포넌트의 조화로운 사용.

---

## 5. Deployment & Tools (배포 및 도구)

- **Version Control**: Git
- **Collaboration**: GitHub
- **Deployment**: Vercel (Frontend), Docker Container support (Backend)
- **API Documentation**: Swagger/OpenAPI (Implied)
