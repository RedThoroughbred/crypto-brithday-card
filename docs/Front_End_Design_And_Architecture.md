# Frontend Design & Architecture Guide

> Comprehensive overview of the GeoGift frontend architecture, design system, and file structure

## 🎨 **FRONTEND ARCHITECTURE OVERVIEW**

The GeoGift frontend is built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Web3 integration** to support both simple single gifts and complex multi-step chain adventures.

---

## 📱 **PAGES ARCHITECTURE (App Router - Next.js 14)**

```
frontend/app/
├── page.tsx                 # 🏠 Homepage/Landing page - App entry point
├── layout.tsx              # 🎯 Root layout with Web3 providers & global styles
├── globals.css             # 🎨 Global styles & Tailwind CSS imports
├── create/page.tsx         # 🎁 Single gift creation (3-step wizard)
├── create-chain/page.tsx   # 🔗 Multi-step chain creation (4-step wizard)
├── claim/page.tsx          # 📍 Single gift claiming interface with GPS
├── claim-chain/page.tsx    # 🗺️ Multi-step chain claiming interface
├── gift/[id]/page.tsx      # 🎁 Individual gift display/sharing page
├── chain/[id]/page.tsx     # 🔗 Individual chain display/sharing page
├── dashboard/page.tsx      # 📊 User dashboard (gift history, statistics)
├── profile/page.tsx        # 👤 User profile management
├── settings/page.tsx       # ⚙️ App settings and preferences
├── test-wallet/page.tsx    # 🔧 Development wallet testing utilities
└── test/page.tsx          # 🧪 Development testing playground
```

### **Page Descriptions:**

- **`page.tsx`**: Landing page with hero section and platform overview
- **`create/page.tsx`**: 3-step single gift creation wizard (Details → Location → Review)
- **`create-chain/page.tsx`**: 4-step chain creation wizard with templates
- **`claim/page.tsx`**: GPS-based claiming interface for single gifts
- **`claim-chain/page.tsx`**: Progressive step-by-step chain claiming
- **`gift/[id]/page.tsx`**: Share individual gifts with clean URLs
- **`chain/[id]/page.tsx`**: Share multi-step chain adventures

---

## 🧩 **COMPONENTS ARCHITECTURE**

```
frontend/components/
├── layout/
│   ├── main-layout.tsx     # 🏗️ Main app layout wrapper with navigation
│   ├── header.tsx          # 🔝 Navigation header with wallet connection
│   └── footer.tsx          # ⬇️ App footer with links and branding
├── ui/ (shadcn/ui component library)
│   ├── button.tsx          # 🔘 Customizable button component
│   ├── card.tsx           # 🃏 Card containers for content sections
│   ├── input.tsx          # ⌨️ Form input fields
│   ├── select.tsx         # 📋 Dropdown select components
│   ├── textarea.tsx       # 📝 Multi-line text input areas
│   ├── dialog.tsx         # 💬 Modal dialog overlays
│   ├── badge.tsx          # 🏷️ Status and category badges
│   ├── alert.tsx          # ⚠️ Alert and notification messages
│   ├── label.tsx          # 🏷️ Form field labels
│   ├── toast.tsx          # 🍞 Toast notification component
│   └── toaster.tsx        # 🍞 Toast notification provider
├── wallet/
│   └── balance-display.tsx # 💰 Real-time GGT/ETH balance display
├── chain-wizard/
│   ├── chain-step-builder.tsx    # 🔧 Individual step creation interface
│   └── enhanced-step-builder.tsx # 🚀 Advanced step builder with unlock types
├── chain/
│   └── step-unlock-display.tsx   # 🔓 Step claiming and unlock interface
├── gift-created-modal.tsx        # 🎉 Single gift creation success modal
├── chain-created-modal.tsx       # 🎆 Chain creation success modal with sharing
└── providers.tsx                 # 🔌 Web3 wallet and RainbowKit providers
```

### **Component Categories:**

**Layout Components:**
- Handle app structure, navigation, and global layout
- Responsive design with mobile-first approach
- Web3 wallet integration in header

**UI Components (shadcn/ui):**
- Consistent design system across the app
- Accessible and customizable components
- Tailwind CSS utility classes for styling

**Specialized Components:**
- Wallet integration and balance display
- Chain creation wizard with step builder
- Modal success screens with sharing functionality

---

## 🎨 **STYLING & DESIGN SYSTEM**

```
frontend/
├── globals.css             # 🎨 Global styles, CSS reset, Tailwind base
├── tailwind.config.js      # 🎨 Tailwind configuration, custom theme, colors
├── postcss.config.js       # 🎨 PostCSS configuration for CSS processing
└── public/
    ├── favicon.ico         # 🌟 App favicon for browser tabs
    ├── favicon-16x16.png   # 🌟 Small icon for bookmarks
    └── manifest.json       # 📱 PWA manifest for mobile app behavior
```

### **Design System Features:**

**Color Palette:**
- Custom GeoGift brand colors
- Dark mode and light mode support
- Consistent color tokens across components

**Typography:**
- Professional font stack
- Consistent heading and text styles
- Responsive typography scaling

**Spacing & Layout:**
- Tailwind spacing scale
- Consistent padding and margins
- Grid and flexbox layouts

---

## 🔧 **HOOKS & STATE MANAGEMENT**

```
frontend/hooks/
├── useAuth.ts              # 🔐 Web3 wallet authentication & JWT management
├── useLocationEscrow.ts    # 🎁 Single gift smart contract interactions
├── useLocationChainEscrow.ts # 🔗 Multi-step chain smart contract hooks
└── use-toast.ts           # 🍞 Toast notification management
```

### **Hook Descriptions:**

**`useAuth.ts`:**
- MetaMask wallet connection
- Web3 signature-based authentication
- JWT token management
- User session handling

**`useLocationEscrow.ts`:**
- Single gift creation flow
- GGT token approval and transfer
- Gift claiming with GPS verification
- Transaction state management

**`useLocationChainEscrow.ts`:**
- Multi-step chain creation
- Sequential step claiming
- Chain progress tracking
- Advanced unlock type handling

---

## 📚 **LIBRARIES & UTILITIES**

```
frontend/lib/
├── utils.ts               # 🛠️ General utility functions (formatters, helpers)
├── contracts.ts           # 🔗 Smart contract addresses, ABIs, network config
├── tokens.ts              # 🪙 GGT token configuration and metadata
├── unlock-types.ts        # 🔓 7 unlock type definitions and handlers
├── api.ts                 # 🌐 Backend API client and type-safe requests
└── email-templates.ts     # 📧 Email template generation and formatting
```

### **Library Descriptions:**

**`contracts.ts`:**
- Smart contract addresses for different networks
- Contract ABIs for TypeScript typing
- Network configuration and RPC endpoints

**`unlock-types.ts`:**
- GPS, Video, Image, Markdown, Quiz, Password, URL types
- Validation logic for each unlock mechanism
- UI components for different unlock types

**`api.ts`:**
- Type-safe backend API calls
- Authentication header management
- Error handling and retry logic

---

## ⚙️ **CONFIGURATION FILES**

```
frontend/
├── next.config.js         # ⚙️ Next.js configuration, webpack, env vars
├── tsconfig.json          # 📝 TypeScript compiler configuration
├── package.json           # 📦 Dependencies, scripts, project metadata
├── vitest.config.ts       # 🧪 Unit testing configuration
├── playwright.config.ts   # 🎭 End-to-end testing configuration
└── config/index.ts        # ⚙️ App-wide configuration constants
```

### **Key Dependencies:**

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "@rainbow-me/rainbowkit": "^1.x",
    "wagmi": "^1.x",
    "viem": "^1.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x"
  }
}
```

---

## 🎯 **KEY DESIGN FEATURES**

### **🎨 Design System Architecture:**

**Utility-First Styling:**
- **Tailwind CSS** for rapid development
- Custom utility classes for GeoGift branding
- Consistent spacing and color scales

**Component Library:**
- **shadcn/ui** for accessible, customizable components
- Consistent design patterns across all pages
- Easy theming and customization

**Responsive Design:**
- Mobile-first approach
- Breakpoint-based responsive utilities
- Touch-friendly interface elements

### **🎭 User Experience Highlights:**

**Gift Creation Flow:**
- **3-step single gift wizard**: Details → Location & Clues → Review & Create
- **4-step chain creation wizard**: Template → Steps → Review → Create
- Real-time form validation with helpful error messages
- Interactive map integration for location selection

**Claiming Experience:**
- **Progressive unlock interface** for multi-step chains
- **GPS verification** with visual feedback
- **Success animations** and sharing modals
- **Transaction tracking** with real-time updates

**Wallet Integration:**
- **MetaMask connection** with RainbowKit UI
- **Real-time balance display** for GGT and ETH tokens
- **Transaction signing** with clear user feedback
- **Network switching** support

### **🔧 Technical Architecture:**

**Modern React Patterns:**
- **Next.js 14 App Router** for file-based routing
- **Server Components** for optimal performance
- **Client Components** for interactive features
- **TypeScript** for type safety throughout

**Form Management:**
- **React Hook Form** for performant form handling
- **Zod schemas** for runtime validation
- **Multi-step wizards** with state persistence
- **Real-time validation** and error feedback

**Web3 Integration:**
- **Wagmi hooks** for Ethereum interactions
- **RainbowKit** for wallet connection UI
- **viem** for low-level blockchain operations
- **TypeChain** for contract type generation

---

## 🚀 **ARCHITECTURAL BENEFITS**

### **Scalability:**
- Modular component architecture
- Reusable hooks and utilities
- Consistent design system
- Type-safe development

### **Performance:**
- Next.js optimization features
- Efficient re-rendering with React hooks
- Lazy loading for large components
- Optimized bundle splitting

### **Developer Experience:**
- TypeScript for better IDE support
- Hot module replacement for fast development
- Comprehensive testing setup
- Clear file organization and naming

### **User Experience:**
- Fast, responsive interface
- Intuitive navigation and flows
- Real-time feedback and updates
- Accessible design patterns

---

## 📈 **FUTURE ENHANCEMENTS**

### **Planned Features:**
- Progressive Web App (PWA) capabilities
- Advanced animations with Framer Motion
- Internationalization (i18n) support
- Enhanced mobile experience
- Dark/light mode persistence

### **Performance Optimizations:**
- Image optimization and lazy loading
- Service worker for offline functionality
- Bundle size optimization
- Enhanced caching strategies

---

**This frontend architecture successfully supports both the simple single gift flow and complex multi-step chain adventures, providing a professional, scalable, and user-friendly interface for the GeoGift platform!** 🎉