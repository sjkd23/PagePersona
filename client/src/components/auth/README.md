# Authentication Components Documentation

This directory contains all authentication-related components for the PagePersona AI application. The components are organized into modular, reusable pieces with comprehensive documentation and type safety.

## 📁 Component Overview

### Main Components

- **`EnhancedUserProfile.tsx`** - ⭐ **Primary profile component** (recommended)
- **`UserProfile.tsx`** - Legacy profile component (kept for compatibility)
- **`Auth0Login.tsx`** - Complete authentication interface
- **`Auth0DebugInfo.tsx`** - Development debugging tool

### Modular Components

- **`ProfileHeader.tsx`** - User header with avatar and actions
- **`MembershipStatus.tsx`** - Membership tier and usage display
- **`ProfileForm.tsx`** - Profile editing form
- **`ProfileStats.tsx`** - Account statistics sidebar

### Utilities & Types

- **`types.ts`** - TypeScript interfaces and types
- **`utils/membershipUtils.ts`** - Membership logic and calculations
- **`index.ts`** - Clean exports for all components

### Styles

- **`UserProfile.css`** - Main profile styling
- **`ProfileComponents.css`** - Enhanced component styles
- **`Auth0DebugInfo.css`** - Debug component styling

## 🚀 Quick Start

### Basic Usage

```tsx
import { EnhancedUserProfile, Auth0Login } from './components/auth';

// Use in your main profile page
<EnhancedUserProfile />

// Use in authentication flow
<Auth0Login onBack={() => navigate('/')} />
```

### Advanced Usage (Custom Layout)

```tsx
import { 
  ProfileHeader, 
  MembershipStatus, 
  ProfileForm, 
  ProfileStats 
} from './components/auth';

// Build custom profile layout
function CustomProfile() {
  return (
    <div className="custom-layout">
      <ProfileHeader {...headerProps} />
      <div className="grid">
        <ProfileForm {...formProps} />
        <div className="sidebar">
          <MembershipStatus {...membershipProps} />
          <ProfileStats {...statsProps} />
        </div>
      </div>
    </div>
  );
}
```

## 🏗️ Architecture

### Component Hierarchy

```
EnhancedUserProfile (Main Container)
├── ProfileHeader (User info + actions)
├── MembershipStatus (Tier + usage)
└── Content Grid
    ├── ProfileForm (Personal info + preferences)
    └── ProfileStats (Statistics + actions)
```

### Data Flow

1. **Auth0** provides authentication and basic user data
2. **MongoDB** stores extended profile information
3. **API Client** syncs data between Auth0 and database
4. **Components** display and manage user interface

## 🔧 Configuration

### Environment Variables

```bash
# Required for Auth0 integration
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience

# Optional for development
VITE_DEBUG_AUTH=true
```

### TypeScript Configuration

All components use strict TypeScript with comprehensive interfaces:

```tsx
import type { 
  MembershipTier, 
  ProfileEditForm, 
  UserPreferences 
} from './types';
```

## 🎨 Styling

### CSS Architecture

- **Base styles**: `UserProfile.css` (legacy compatibility)
- **Enhanced styles**: `ProfileComponents.css` (modern features)
- **Component-specific**: `Auth0DebugInfo.css`

### Dark Mode Support

All components support dark mode through CSS custom properties:

```css
.dark .component {
  background-color: var(--dark-bg);
  color: var(--dark-text);
}
```

### Responsive Design

Components are fully responsive with mobile-first approach:

```css
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🧪 Testing

### Development Tools

- **Auth0DebugInfo**: Shows raw Auth0 and MongoDB data
- **Error boundaries**: Comprehensive error handling
- **Loading states**: Visual feedback for all async operations

### Debug Mode

```tsx
// Add to any profile page during development
import { Auth0DebugInfo } from './components/auth';

<Auth0DebugInfo /> // Only renders in development
```

## 📊 Features

### ✅ Implemented Features

- ✅ Auth0 integration with social logins
- ✅ MongoDB profile synchronization
- ✅ Membership tier management (Free/Premium/Admin)
- ✅ Usage tracking and limits
- ✅ Profile editing with validation
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Accessibility compliance (WCAG 2.1)
- ✅ Error handling and recovery
- ✅ Loading states and feedback
- ✅ TypeScript strict mode
- ✅ Comprehensive documentation

### 🚧 Planned Enhancements

- 🚧 Avatar upload functionality
- 🚧 Two-factor authentication
- 🚧 Account deletion workflow
- 🚧 Profile export/import
- 🚧 Advanced privacy settings

## 🔒 Security

### Authentication Flow

1. User clicks login → Redirected to Auth0
2. Auth0 validates credentials → Returns JWT token
3. Token sent to API → Creates/updates MongoDB profile
4. Profile data synchronized → UI updates

### Data Protection

- **JWT tokens**: Secure authentication
- **HTTPS only**: All API communication
- **Input validation**: Client and server-side
- **CSRF protection**: Built into Auth0 flow

## 🐛 Troubleshooting

### Common Issues

**Profile not loading**
```bash
# Check Auth0 configuration
# Verify API endpoint connectivity
# Check browser console for errors
```

**Name sync failing**
```tsx
// Use Auth0DebugInfo to inspect data
<Auth0DebugInfo />
```

**Styling issues**
```css
/* Ensure both CSS files are imported */
import './UserProfile.css';
import './ProfileComponents.css';
```

### Error Codes

- `AUTH_001`: Auth0 configuration missing
- `PROFILE_001`: Database connection failed
- `SYNC_001`: Profile synchronization failed

## 📚 API Reference

### Component Props

```tsx
// EnhancedUserProfile
<EnhancedUserProfile />

// Auth0Login  
<Auth0Login onBack={() => void} />

// ProfileHeader
<ProfileHeader 
  user={User}
  profile={UserProfile}
  editing={boolean}
  onEdit={() => void}
  onSave={() => void}
  onCancel={() => void}
  isLoading={boolean}
/>
```

### Utility Functions

```tsx
import { 
  getUsageLimit,
  getMembershipInfo,
  calculateUsageStats,
  hasPremiumAccess 
} from './utils/membershipUtils';
```

## 🤝 Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Add comprehensive JSDoc comments
- Include prop descriptions and examples

### Component Guidelines

1. **Single Responsibility**: Each component has one clear purpose
2. **Props Interface**: Always define TypeScript interfaces
3. **Error Handling**: Include loading and error states
4. **Accessibility**: Add ARIA labels and keyboard navigation
5. **Documentation**: JSDoc comments for all public APIs

### Testing Requirements

- Unit tests for utility functions
- Integration tests for API interactions
- E2E tests for complete user flows
- Accessibility testing with screen readers

---

## 📞 Support

For questions or issues:
- 📧 Email: dev-team@pagepersona.ai
- 📖 Documentation: `/docs/authentication`
- 🐛 Bug Reports: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

*Last updated: July 2025*
