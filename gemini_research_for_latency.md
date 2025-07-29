# Frontend Latency Investigation

This document outlines the findings of a performance investigation into the GeoGift frontend and provides recommendations for improvement.

## Summary of Findings

The frontend application is experiencing significant performance issues, causing high resource utilization and a sluggish user experience. The investigation has identified four primary causes:

1.  **Invalid WalletConnect Project ID:** The application is using a placeholder WalletConnect Project ID. This causes the application to make a continuous loop of failing network requests, leading to high CPU and memory usage.
2.  **Inefficient UI Updates:** The claim chain page forces a full page reload after a successful claim. This is a jarring and inefficient way to update the UI.
3.  **Large Bundle Size:** The application is using the `mapbox-gl` and `react-map-gl` libraries, which are notoriously large and can significantly slow down initial page loads.
4.  **Potential Performance Bottleneck:** The `ChainStepBuilder` component uses the `@hello-pangea/dnd` library for drag-and-drop functionality. This library is known to have performance issues, especially with large, complex lists.

## Recommendations

To address these issues, the following changes are recommended:

1.  **Update WalletConnect Configuration:**
    *   Add the `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to the `.env.example` file to ensure all developers are aware of this required variable.
    *   Update `frontend/components/providers.tsx` to use a valid, but clearly marked as a placeholder, project ID from WalletConnect.
2.  **Improve UI Update Mechanism:**
    *   Modify `frontend/app/claim-chain/page.tsx` to use the `refetch` function returned by the `useChainData` hook instead of `window.location.reload()`.
3.  **Reduce Bundle Size:**
    *   Configure a bundle analyzer in `next.config.js` to identify the largest components in the application bundle.
    *   Consider using a lighter-weight mapping library if possible.
4.  **Address Potential Performance Bottleneck:**
    *   Investigate alternative drag-and-drop libraries that are more performant.
    *   If no suitable alternative is available, consider optimizing the existing implementation of the `ChainStepBuilder` component.