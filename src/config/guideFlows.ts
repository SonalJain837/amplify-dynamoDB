import { GuideFlow } from '../types/guide';

export const guideFlows: GuideFlow[] = [
  // Quick interactive features tour
  {
    id: 'interactive-features-tour',
    name: 'Interactive Features Tour',
    condition: 'authenticated',
    steps: [
      {
        id: 'interactive-welcome',
        targetSelector: '[data-guide="main-content"]',
        title: 'Explore Interactive Features!',
        description: 'Welcome to your travel dashboard! Let me show you the key interactive features you can use. Click and explore as we go!',
        position: 'center',
        actionRequired: false,
        offset: { x: 0, y: 0 }
      },
      {
        id: 'search-feature-demo',
        targetSelector: '[data-guide="search-input"]',
        title: 'Smart Search Feature',
        description: 'Use this search to find travel companions by destination, date, or travel preferences. Try typing a city name!',
        position: 'bottom',
        actionRequired: true,
        offset: { x: 0, y: 10 }
      },
      {
        id: 'add-trip-demo',
        targetSelector: '[data-guide="add-trip-button"]',
        title: 'Share Your Travel Plans',
        description: 'Click here to add your upcoming trips. Share your itinerary and connect with fellow travelers going to the same destination.',
        position: 'bottom',
        actionRequired: true,
        offset: { x: 0, y: 10 }
      },
      {
        id: 'travel-grid-demo',
        targetSelector: '[data-guide="travel-details"]',
        title: 'Browse Travel Opportunities',
        description: 'This is where you can see all available trips from other travelers. Click on any row to see more details or contact the traveler.',
        position: 'top',
        actionRequired: false,
        offset: { x: 0, y: -10 }
      },
      {
        id: 'contact-travelers',
        targetSelector: '[data-guide="travel-details"] .MuiDataGrid-row:first-child',
        title: 'Connect with Travelers',
        description: 'Click the message icon in any row to start a conversation with that traveler. Build connections before your trip!',
        position: 'right',
        actionRequired: false,
        offset: { x: 10, y: 0 }
      },
      {
        id: 'profile-management',
        targetSelector: '[data-guide="profile-menu"]',
        title: 'Manage Your Profile',
        description: 'Access your profile, view your trips, check messages, and manage account settings from here.',
        position: 'bottom',
        actionRequired: false,
        offset: { x: 0, y: 10 }
      }
    ]
  },
  // Messaging and communication flow
  {
    id: 'messaging-tutorial',
    name: 'Communication & Messaging Guide',
    condition: 'authenticated',
    steps: [
      {
        id: 'messaging-intro',
        targetSelector: 'a[href="/messages"]',
        title: 'Stay Connected with Fellow Travelers',
        description: 'Access your messages to communicate with other travelers. Build relationships and plan together!',
        position: 'bottom',
        actionRequired: true,
        offset: { x: 0, y: 10 }
      },
      {
        id: 'conversation-list',
        targetSelector: '[data-guide="message-list"]',
        title: 'Your Conversations',
        description: 'Here you can see all your active conversations with other travelers. Click any conversation to continue chatting.',
        position: 'right',
        actionRequired: false,
        offset: { x: 10, y: 0 }
      },
      {
        id: 'message-features',
        targetSelector: '[data-guide="chat-input"]',
        title: 'Chat Features',
        description: 'Send messages, share travel details, and coordinate your journey together. Real-time messaging keeps you connected.',
        position: 'top',
        actionRequired: false,
        offset: { x: 0, y: -10 }
      }
    ]
  },
  // Trip planning and management flow
  {
    id: 'trip-planning-guide',
    name: 'Trip Planning & Management',
    condition: 'authenticated',
    steps: [
      {
        id: 'planning-intro',
        targetSelector: '[data-guide="add-trip-button"]',
        title: 'Plan Your Perfect Trip',
        description: 'Let\'s walk through how to add and manage your travel plans effectively. Click here to start adding a trip!',
        position: 'bottom',
        actionRequired: true,
        offset: { x: 0, y: 10 }
      },
      {
        id: 'trip-form-guidance',
        targetSelector: 'form',
        title: 'Fill Your Trip Details',
        description: 'Provide detailed information about your journey. The more details you share, the better matches you\'ll find with fellow travelers.',
        position: 'top',
        actionRequired: false,
        offset: { x: 0, y: -10 }
      },
      {
        id: 'search-destinations',
        targetSelector: '[data-guide="search-input"]',
        title: 'Discover Travel Opportunities',
        description: 'After adding your trip, use search to find others going to similar destinations or on similar dates.',
        position: 'bottom',
        actionRequired: false,
        offset: { x: 0, y: 10 }
      },
      {
        id: 'connect-with-travelers',
        targetSelector: '[data-guide="travel-details"]',
        title: 'Connect & Collaborate',
        description: 'Browse through available trips and connect with travelers. Share experiences and plan together!',
        position: 'top',
        actionRequired: false,
        offset: { x: 0, y: -10 }
      }
    ]
  },
  // Enhanced flow for unauthenticated users starting with registration
  {
    id: 'unauthenticated-onboarding',
    name: 'Getting Started - Registration Journey',
    condition: 'unauthenticated',
    steps: [
      {
        id: 'welcome-introduction',
        targetSelector: '[data-guide="main-content"]',
        title: 'Welcome to Travel Together!',
        description: 'Let\'s get you started on your travel journey. First, we\'ll help you create an account so you can connect with fellow travelers.',
        position: 'center',
        actionRequired: false,
        offset: { x: 0, y: 0 },
        screenshot: {
          src: '/src/assets/guide-screenshots/welcome-intro.png',
          alt: 'Welcome to Travel Together - Homepage overview'
        }
      },
      {
        id: 'profile-menu-intro',
        targetSelector: '[data-guide="profile-menu"]',
        title: 'Access Profile Menu',
        description: 'Click on this profile menu to access registration and login options. This is where you\'ll manage your account.',
        position: 'bottom',
        actionRequired: true,
        offset: { x: 0, y: 10 }
      },
      {
        id: 'register-guidance',
        targetSelector: '[data-guide="register-option"]',
        title: 'Create Your Account',
        description: 'Click "Register" to create your new account. You\'ll be able to share travel plans and connect with other travelers.',
        position: 'left',
        actionRequired: true,
        waitForElement: '[data-guide="register-option"]',
        offset: { x: -10, y: 0 }
      },
      {
        id: 'registration-introduction',
        targetSelector: 'form',
        title: 'Registration Form',
        description: 'Welcome! Let\'s start by creating your account. Fill in your details below to get started.',
        position: 'top',
        actionRequired: false,
        offset: { x: 0, y: -10 },
        screenshot: {
          src: '/src/assets/guide-screenshots/registration-form.png',
          alt: 'Registration form overview showing all required fields'
        }
      },
      {
        id: 'registration-form-fields',
        targetSelector: 'input[name="email"], input[type="email"]',
        title: 'Fill Your Details',
        description: 'Fill in your details to create your account. Start with your email address, then add your password and other required information.',
        position: 'bottom',
        actionRequired: false,
        offset: { x: 0, y: 10 },
        screenshot: {
          src: '/src/assets/guide-screenshots/registration-fields.png',
          alt: 'Registration form fields highlighted for completion'
        }
      },
      {
        id: 'registration-submit',
        targetSelector: 'button[type="submit"], .register-button',
        title: 'Complete Registration',
        description: 'Click the register button to create your account. You\'ll then be able to sign in and start using the platform.',
        position: 'top',
        actionRequired: false,
        offset: { x: 0, y: -10 }
      },
      {
        id: 'login-form-guidance',
        targetSelector: 'form',
        title: 'Sign In Now',
        description: 'Great! Now sign in with your new credentials to access your dashboard and start planning your travels.',
        position: 'top',
        actionRequired: false,
        offset: { x: 0, y: -10 },
        screenshot: {
          src: '/src/assets/guide-screenshots/login-form.png',
          alt: 'Login form showing email and password fields'
        }
      }
    ]
  },
  // Enhanced flow for authenticated users
  {
    id: 'authenticated-onboarding',
    name: 'Explore Your Travel Dashboard',
    condition: 'authenticated',
    steps: [
      {
        id: 'welcome-dashboard',
        targetSelector: '[data-guide="main-content"]',
        title: 'Welcome to Your Dashboard!',
        description: 'Congratulations! You\'re now signed in. This is your travel dashboard where you can view and manage all your travel information, connect with other travelers, and plan amazing journeys.',
        position: 'center',
        actionRequired: false,
        offset: { x: 0, y: 0 },
        screenshot: {
          src: '/src/assets/guide-screenshots/travel-dashboard.png',
          alt: 'Main travel dashboard showing all key features'
        }
      },
      {
        id: 'search-functionality',
        targetSelector: '[data-guide="search-input"]',
        title: 'Search for Travel Companions',
        description: 'Use this search bar to find other travelers going to your destination, filter by dates, or search for specific routes. This is a great way to find travel companions!',
        position: 'bottom',
        actionRequired: false,
        offset: { x: 0, y: 10 }
      },
      {
        id: 'travel-details-navigation',
        targetSelector: '[data-guide="travel-details"]',
        title: 'Your Travel Details',
        description: 'This section shows all your current and upcoming travel information, including flights, destinations, and travel companions. You can see trips from other travelers here too.',
        position: 'top',
        actionRequired: false,
        offset: { x: 0, y: -10 },
        screenshot: {
          src: '/src/assets/guide-screenshots/travel-details.png',
          alt: 'Travel details section showing trip information'
        }
      },
      {
        id: 'add-trip-button',
        targetSelector: '[data-guide="add-trip-button"]',
        title: 'Add Your First Trip',
        description: 'Ready to share your travel plans? Click here to add a new trip to your itinerary. Share your travel plans and connect with other travelers going to the same destination!',
        position: 'bottom',
        actionRequired: false,
        offset: { x: 0, y: 10 },
        screenshot: {
          src: '/src/assets/guide-screenshots/add-trip-button.png',
          alt: 'Add trip button and form demonstration'
        }
      },
      {
        id: 'profile-access-final',
        targetSelector: '[data-guide="profile-menu"]',
        title: 'Your Profile & Settings',
        description: 'Access your profile here to update your information, view your trips, manage settings, or sign out when needed. You\'re all set to start your travel journey!',
        position: 'bottom',
        actionRequired: false,
        offset: { x: 0, y: 10 }
      }
    ]
  },
  // Quick tour for existing users who want to see features
  {
    id: 'feature-tour',
    name: 'Quick Feature Tour',
    condition: 'authenticated',
    steps: [
      {
        id: 'dashboard-overview',
        targetSelector: '[data-guide="main-content"]',
        title: 'Dashboard Overview',
        description: 'Here\'s a quick tour of the main features available in your travel dashboard.',
        position: 'center',
        actionRequired: false,
        offset: { x: 0, y: 0 }
      },
      {
        id: 'search-features',
        targetSelector: '[data-guide="search-input"]',
        title: 'Search & Discovery',
        description: 'Find travel companions, search destinations, and discover new travel opportunities.',
        position: 'bottom',
        actionRequired: false,
        offset: { x: 0, y: 10 }
      },
      {
        id: 'trip-management',
        targetSelector: '[data-guide="add-trip-button"]',
        title: 'Trip Management',
        description: 'Add, edit, and manage your travel itineraries with ease.',
        position: 'bottom',
        actionRequired: false,
        offset: { x: 0, y: 10 }
      }
    ]
  }
];

// Enhanced guide flow management functions
export const getGuideFlowById = (id: string): GuideFlow | undefined => {
  return guideFlows.find(flow => flow.id === id);
};

export const getGuideFlowByCondition = (condition: 'authenticated' | 'unauthenticated'): GuideFlow | undefined => {
  return guideFlows.find(flow => flow.condition === condition);
};

export const getAllGuideFlows = (): GuideFlow[] => {
  return [...guideFlows];
};

export const getGuideFlowsByCondition = (condition: 'authenticated' | 'unauthenticated'): GuideFlow[] => {
  return guideFlows.filter(flow => flow.condition === condition);
};

export const getInteractiveGuideFlows = (): GuideFlow[] => {
  return guideFlows.filter(flow => 
    flow.id === 'interactive-features-tour' || 
    flow.id === 'messaging-tutorial' || 
    flow.id === 'trip-planning-guide'
  );
};

// Get guide flows suitable for quick help
export const getQuickHelpFlows = (): GuideFlow[] => {
  return guideFlows.filter(flow => flow.id === 'feature-tour');
};