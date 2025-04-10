# Current Project State

This is an Expo Router project with a file-based routing system, implementing a mobile manga reader for Kavita servers.

## Core Architecture

### Routing
- Using Expo Router with file-based routing
- Authentication flow via `/(auth)/connect.tsx`
- Main content via `/(main)/home.tsx`
- Series details via `/(main)/series/[id].tsx`
- Root layout handling navigation and auth checks

### API Integration
- Connection to Kavita servers via ODPS URL
- JWT authentication with secure token storage
- Cross-platform storage with SecureStore/localStorage
- Platform-aware API client that handles CORS issues for web

### State Management
- Zustand stores for global state
- `authStore.ts`: Authentication, connection status, server info
- `mangaStore.ts`: Series data, loading states, cover image URLs

### Theming & UI
- Dark/light mode with `useColorScheme`
- Themed components with consistent styling
- Responsive layouts for different devices

## Completed Features

### Authentication
- Connect to Kavita server via ODPS URL
- Parse and validate connection URLs
- Secure token storage
- Auto-reconnection logic

### Library Screen
- Display manga series in grid layout
- Manga cover images with titles
- Pull-to-refresh functionality
- Error handling and loading states

### Series Detail Screen
- Hero section with cover image and metadata
- Reading progress indicator with percentage
- Continue/Read Again button with smart navigation
- Volume selector with horizontal scrolling
- Normalized chapters list with proper labeling
- Visual indicators for read status
- Support for invalid metadata handling

### UI Components
- `ThemedView` and `ThemedText` for consistent styling
- `MangaCard` for displaying series
- `Button` and `Input` components with theming support
- Basic navigation structure

### Cross-Platform API Architecture
- Unified storage adapter in `utils/storage.ts`
- Platform-aware API client with proxy support for web
- Centralized authentication logic in `api/auth.ts`
- Clean separation of concerns across all modules

## Pending Features

### Reader Experience
- Manga reader implementation
- Page navigation
- Reading controls
- Progress tracking

### Advanced Features
- Search functionality
- Library filtering
- Reading lists
- Settings screen
- Performance optimizations

## Technical Considerations

### Cross-Platform Support
- Platform-specific handling for iOS, Android, and web
- Web proxy server to bypass CORS restrictions
- Native direct API access for better performance
- Unified image loading across platforms

## API Architecture

### Simplified API Structure
1. `utils/storage.ts`
   - Cross-platform storage adapter (SecureStore/localStorage)
   - Central location for storage keys
   - Consistent async interface

2. `api/client.ts`
   - Platform-aware request function `makeRequest`
   - Proxy routing for web requests
   - Direct API calls for native platforms
   - Health check for proxy availability

3. `api/auth.ts`
   - Authentication-specific logic
   - ODPS URL parsing
   - Token management
   - Server connection flow

4. `api/manga.ts`
   - Manga-specific API functions
   - Uses unified request method
   - No platform-specific code

5. `store/authStore.ts` & `store/mangaStore.ts`
   - Clean state management
   - Delegate API calls to respective modules
   - No direct platform detection

### Image Handling
- Platform-aware image URL generation
- Proxy support for web image loading
- Direct URLs for native platforms
- Consistent interface for all components