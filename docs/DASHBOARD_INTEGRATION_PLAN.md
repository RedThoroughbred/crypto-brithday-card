# Dashboard Integration Plan

This document outlines the step-by-step plan to implement the user dashboard feature for the GeoGift platform.

## 🎯 Goal

To provide users with a comprehensive view of their gift and chain history, including statistics and quick actions, thereby completing the user experience loop and increasing retention.

## 📅 Estimated Effort

2-3 days

---

## Backend Development (FastAPI & PostgreSQL)

### Step 1: Create New API Endpoints

I will create a new API router for the dashboard, likely located at `backend/app/api/v1/endpoints/dashboard.py`. This will keep the dashboard-related logic organized and separate from other parts of the API.

The following endpoints will be created:

*   **`GET /api/v1/dashboard/stats`**: Fetches aggregate statistics for the authenticated user.
    *   Total GGT spent on gifts and chains.
    *   Total number of gifts created.
    *   Total number of chains created.
    *   Completion rates for gifts and chains.
*   **`GET /api/v1/dashboard/gifts/sent`**: Retrieves a paginated list of single gifts created by the user.
*   **`GET /api/v1/dashboard/gifts/received`**: Retrieves a paginated list of single gifts received by the user.
*   **`GET /api/v1/dashboard/chains/sent`**: Retrieves a paginated list of multi-step chains created by the user.
*   **`GET /api/v1/dashboard/chains/received`**: Retrieves a paginated list of multi-step chains received by the user.

### Step 2: Implement Database Queries (CRUD)

I will add new functions to the `backend/app/crud/` directory to query the database for the information needed by the dashboard API endpoints. These functions will be optimized for performance and will include:

*   Functions to calculate statistics (e.g., `get_user_stats`).
*   Functions to fetch paginated lists of gifts and chains, joining relevant tables to include necessary details like recipient information and completion status.

### Step 3: Define Pydantic Schemas

I will create new Pydantic schemas in `backend/app/schemas/dashboard.py` to define the structure of the data returned by the new API endpoints. This will ensure that the API responses are consistent and well-documented. Schemas will be defined for:

*   `DashboardStats`
*   `DashboardGift`
*   `DashboardChain`

---

## Frontend Development (Next.js & React)

### Step 1: Create the Dashboard Page

I will create a new page at `frontend/app/dashboard/page.tsx`. This page will be protected, requiring the user to be authenticated to view it. It will serve as the main container for the dashboard components.

### Step 2: Build UI Components

I will develop a set of reusable React components in the `frontend/components/dashboard/` directory:

*   **`StatsCards.tsx`**: A component to display the user's statistics in an engaging way.
*   **`GiftsTable.tsx`**: A table to display the list of sent or received gifts, with columns for important details and action buttons (e.g., "View Details", "Resend Link").
*   **`ChainsTable.tsx`**: A similar table for multi-step chains.
*   **`DashboardTabs.tsx`**: Tabs to switch between "Sent" and "Received" views for both gifts and chains.
*   **`DetailsModal.tsx`**: A modal component to show a detailed view of a selected gift or chain.

### Step 3: API Integration

I will update the frontend's API client (`frontend/lib/api.ts`) to include functions for fetching data from the new backend dashboard endpoints. I will use `tanstack/react-query` for data fetching, which will handle caching, loading states, and error handling automatically.

### Step 4: State Management (Zustand)

I will use the existing Zustand store to manage the dashboard's state, such as the active tab, pagination, and any filters the user applies.

---

## 🚀 Implementation Order

1.  **Backend First**: I will start by implementing the backend API endpoints and database queries. This will provide the necessary data for the frontend to consume.
2.  **Frontend Development**: Once the backend is ready, I will build the frontend components and integrate them with the API.
3.  **Testing**: I will add tests for both the backend and frontend to ensure the dashboard is working correctly and is free of bugs.

By following this plan, I can efficiently build a robust and user-friendly dashboard that will be a valuable addition to the GeoGift platform.
