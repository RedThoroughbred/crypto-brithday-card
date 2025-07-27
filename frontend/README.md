# GeoGift Frontend

A Next.js 14 application for the GeoGift platform - location-verified crypto gift cards.

## Features

- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** with shadcn/ui components
- **Web3 Integration** with wagmi and RainbowKit
- **Interactive Maps** with Mapbox GL JS
- **State Management** with Zustand
- **Animations** with Framer Motion
- **Form Handling** with React Hook Form and Zod
- **Testing** with Vitest and Playwright
- **Mobile Responsive** design

## Getting Started

### Prerequisites

- Node.js 18.0.0+
- npm 9.0.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-birthday-card/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   ```env
   # Blockchain Configuration
   NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-api-key
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN_ID=137
   
   # Map Services
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1...
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Testing
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:e2e` - Run end-to-end tests with Playwright

## Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard page
│   ├── create/           # Gift creation flow
│   ├── claim/            # Gift claiming page
│   ├── profile/          # User profile
│   ├── settings/         # User settings
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── ui/               # Basic UI components (shadcn/ui)
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   └── maps/             # Map components
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── config/               # Application configuration
├── stores/               # State management (Zustand)
└── utils/                # Helper utilities
```

## Key Components

### Layout Components
- `MainLayout` - Main application layout with header and footer
- `Header` - Navigation header with wallet connection
- `Footer` - Application footer

### Page Components
- `HomePage` - Landing page with features and CTA
- `DashboardPage` - User dashboard with gift overview
- `CreateGiftPage` - Multi-step gift creation flow
- `ClaimGiftPage` - Gift claiming with location verification
- `ProfilePage` - User profile and achievements
- `SettingsPage` - User preferences and configuration

### UI Components
- `Button` - Customizable button component
- `Card` - Card container component
- `Input` - Form input component
- `Toast` - Notification component

## Web3 Integration

The application uses wagmi and RainbowKit for Web3 functionality:

- **Wallet Connection** - Support for MetaMask, WalletConnect, and other wallets
- **Smart Contract Interaction** - Read and write operations with the LocationEscrow contract
- **Chain Management** - Polygon mainnet and testnet support
- **Transaction Handling** - User-friendly transaction flows

## State Management

Using Zustand for lightweight state management:

- **User State** - Current user information and preferences
- **Gift State** - Active gifts and creation flow state
- **Location State** - GPS location and verification status
- **UI State** - Modal states, loading states, and notifications

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **CSS Variables** - Theme-based color system
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - Theme switching with next-themes
- **Custom Components** - Styled with class-variance-authority

## Form Handling

- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Type Safety** - Full TypeScript integration
- **Error Handling** - User-friendly validation messages

## Location Services

- **GPS Integration** - Browser geolocation API
- **Mapbox Integration** - Interactive maps
- **Location Verification** - Distance calculation and validation
- **Privacy** - Secure location handling

## Testing

### Unit Tests (Vitest)
```bash
npm run test
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

### Test Files
- `__tests__/` - Unit test files
- `tests/e2e/` - End-to-end test files

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Ensure all required environment variables are set for production:
- Blockchain RPC URLs
- Contract addresses
- API endpoints
- Map service tokens

### Hosting Platforms
- **Vercel** (Recommended)
- **Netlify**
- **AWS Amplify**
- **Custom server**

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use semantic commit messages
- Write tests for new features

### Component Development
- Use functional components with hooks
- Implement proper error boundaries
- Ensure accessibility (a11y) compliance
- Follow responsive design principles

### Performance
- Implement code splitting
- Optimize images and assets
- Use React.memo for expensive components
- Minimize bundle size

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues**
   - Ensure MetaMask is installed
   - Check network configuration
   - Verify contract addresses

2. **Location Permission Denied**
   - Enable location services in browser
   - Check HTTPS requirement for geolocation

3. **Build Errors**
   - Clear `.next` folder and rebuild
   - Check for TypeScript errors
   - Verify environment variables

4. **Map Not Loading**
   - Verify Mapbox access token
   - Check network connectivity
   - Ensure HTTPS for production

### Getting Help

- Check the [GitHub Issues](https://github.com/geogift/issues)
- Review the [documentation](./docs)
- Join our [Discord community](https://discord.gg/geogift)

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.