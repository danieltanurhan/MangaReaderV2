# Current Project State

This is an Expo Router project with a file-based routing system, implementing a mobile manga reader for Kavita servers.

## Core Architecture

### Routing
- Using Expo Router with file-based routing
- Authentication flow via `/(auth)/connect.tsx`
- Main content via `/(main)/home.tsx`
- Root layout handling navigation and auth checks

### API Integration
- Connection to Kavita servers via ODPS URL
- JWT authentication with secure token storage
- Cross-platform storage with SecureStore/localStorage
- Axios client for API requests

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

### UI Components
- `ThemedView` and `ThemedText` for consistent styling
- `MangaCard` for displaying series
- `Button` and `Input` components with theming support
- Basic navigation structure

## Pending Features

### Series Detail Screen
- Cover image with details
- Volume/chapter listing
- Metadata display
- Reading progress

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
- Platform-specific code for iOS, Android, and web