# Project Structure Overview

This is an Expo Router project with a file-based routing system, organized as follows:

## Routing

- Uses Expo Router file-based routing
- Main app structure is in `app` folder
- Tab-based navigation in `(tabs)` folder
- Root layout in `_layout.tsx`

## UI Components

- Themed components in `components` (like `ThemedText` and `ThemedView`)
- UI elements like `ParallaxScrollView` for visual effects
- Utility components like `Collapsible`

## Styling/Theming

- Dark/light mode support via `useColorScheme`
- Theme colors defined in `Colors.ts`
- Responsive styling using React Native's `StyleSheet`

## Key Technical Features

### Theme System

- Automatically responds to system dark/light mode
- Custom themed components for consistent appearance

### Navigation

- Tab navigation with custom tab bar
- Stack navigation for screens

### Animation

- Uses React Native Reanimated for animations
- Examples like the `HelloWave` component

### Cross-Platform

- Handles platform-specific code with `.ios.tsx` or `.web.ts` file extensions

## For Building a Kavita Manga Reader

For a Kavita manga reader app using the Kavita API, we'd need to:

### API Integration

- Create API services to connect to your hosted Kavita solution

### Screen Design

- Authentication
- Library browsing
- Series/volume/chapter navigation
- Manga reading experience

The existing structure provides a solid foundation. We can use the theming system, navigation patterns, and component architecture while adding API integration and manga-specific UI elements.