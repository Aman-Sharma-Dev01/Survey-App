# How to Add New Features to HomePage

## Quick Start

The HomePage component is designed to be easily extensible. All features are defined in a simple array at the top of the component.

## Feature Object Template

```javascript
{
  id: 'unique-id',                    // Unique identifier
  title: 'Feature Title',             // Display name
  description: 'Feature description', // Short description
  icon: IconComponent,                // Lucide React icon
  color: 'from-color-500 to-color-600',           // Gradient colors
  lightBg: 'bg-color-50',                         // Light background
  hoverColor: 'group-hover:from-color-600 group-hover:to-color-700',  // Hover gradient
  lightHover: 'group-hover:bg-color-100',         // Hover light bg
  actionButtons: [
    {
      label: 'Button Label',
      action: 'route-path',  // null for "Coming Soon" effect
      icon: IconComponent
    }
  ]
}
```

## Step-by-Step Example

### Add a New Feature: "Email Campaigns"

1. **Open** [src/pages/HomePage.jsx](src/pages/HomePage.jsx)

2. **Find** the `features` array (around line 13)

3. **Add** your new feature object:

```javascript
{
  id: 'email-campaigns',
  title: 'Email Campaigns',
  description: 'Send targeted email campaigns to your survey respondents',
  icon: Mail,  // Import from lucide-react
  color: 'from-pink-500 to-rose-600',
  lightBg: 'bg-pink-50',
  hoverColor: 'group-hover:from-pink-600 group-hover:to-rose-700',
  lightHover: 'group-hover:bg-pink-100',
  actionButtons: [
    { label: 'View Campaigns', action: 'email-campaigns', icon: LayoutGrid },
    { label: 'Create Campaign', action: 'email-create', icon: Plus }
  ]
}
```

4. **Update App.jsx** routing (if new routes are needed):

```javascript
case 'email-campaigns':
  return <EmailCampaigns navigate={navigate} />;

case 'email-create':
  return <EmailCreate navigate={navigate} />;
```

5. **Import new components** in App.jsx if needed

## Available Color Schemes

Use Tailwind colors for consistency. Here are some suggestions:

| Feature Type | Colors | Example |
|---|---|---|
| Analytics | green/emerald | `from-green-500 to-emerald-600` |
| Data Management | cyan/blue | `from-cyan-500 to-blue-600` |
| Marketing | pink/rose | `from-pink-500 to-rose-600` |
| Reports | indigo/purple | `from-indigo-500 to-purple-600` |
| Settings | gray/slate | `from-gray-500 to-slate-600` |
| Tools | amber/orange | `from-amber-500 to-orange-600` |
| Integrations | violet/purple | `from-violet-500 to-purple-600` |

## Available Icons from lucide-react

The component already imports common icons. For more, import from lucide-react:

```javascript
import { Mail, Settings, BarChart3, Activity, Database, Share2, Shield } from 'lucide-react';
```

## "Coming Soon" Features

To show a feature that's not yet implemented:

```javascript
{
  id: 'future-feature',
  title: 'Coming Soon Feature',
  description: 'This feature is under development',
  icon: Rocket,
  color: 'from-gray-400 to-gray-500',
  lightBg: 'bg-gray-50',
  hoverColor: 'group-hover:from-gray-500 group-hover:to-gray-600',
  lightHover: 'group-hover:bg-gray-100',
  actionButtons: [
    { label: 'Coming Soon', action: null, icon: ArrowRight }  // null action = disabled
  ]
}
```

## Feature Order

Features appear in the order they're listed in the array. Reorder them by moving objects around:

```javascript
const features = [
  // Most important/frequently used first
  surveysFeature,
  quizzesFeature,
  newFeature,  // Add new ones here
  aiToolsFeature,
];
```

## Styling Tips

### Keep Consistent Spacing
- All boxes use: `p-8` padding
- Grid uses: `gap-6 lg:gap-8` spacing
- Max width: `max-w-7xl`

### Icon Sizing
- Icon containers: `w-16 h-16`
- Icons: `size={32}`

### Button Sizing
- Padding: `px-4 py-3`
- Font: `text-sm sm:text-base`

### Responsive Breakpoints
- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns

## Animation Customization

To adjust animations, modify in [src/pages/HomePage.jsx](src/pages/HomePage.jsx):

```javascript
// Scale on hover (default: scale-105)
isHovered ? 'scale-105' : ''

// Shadow enhancement (default: shadow-2xl)
isHovered ? 'shadow-2xl' : 'shadow-lg'

// Transition duration (default: 300ms)
'transition-all duration-300'
```

## No Need to Modify Navbar!

**One of the biggest advantages:** You don't need to add buttons to the navbar anymore. Just add to the features array, and the HomePage handles everything automatically.

## File Structure Reference

```
frontend/src/
├── pages/
│   ├── HomePage.jsx          ← Main feature hub (modify this)
│   ├── YourNewFeature.jsx    ← Your new feature component
│   └── ...
├── components/
│   ├── Navbar.jsx            ← No changes needed!
│   └── ...
└── App.jsx                   ← Add routing if needed
```

---

**That's it!** The HomePage will automatically render your new feature with all animations, styling, and responsive behavior. 🎉
