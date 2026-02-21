import { trigger, transition, style, animate, query, stagger, animateChild, group } from '@angular/animations';

/**
 * Page Transition Animation
 * Used for smooth page transitions when navigating between routes
 * Duration: 300ms entrance, 200ms exit
 */
export const pageTransition = trigger('pageTransition', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
  ])
]);

/**
 * Fade In Animation
 * Simple fade-in effect for elements entering the view
 * Duration: 200ms
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms ease-out', style({ opacity: 1 }))
  ])
]);

/**
 * Fade Out Animation
 * Simple fade-out effect for elements leaving the view
 * Duration: 150ms
 */
export const fadeOut = trigger('fadeOut', [
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0 }))
  ])
]);

/**
 * Slide Up Animation
 * Elements slide up from below while fading in
 * Duration: 250ms
 */
export const slideUp = trigger('slideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(30px)' }),
    animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

/**
 * Slide Down Animation
 * Elements slide down from above while fading in
 * Duration: 250ms
 */
export const slideDown = trigger('slideDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-30px)' }),
    animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

/**
 * List Animation with Stagger
 * Animates list items with a staggered delay for a cascading effect
 * Used for dashboard cards, table rows, and list items
 * Stagger delay: 50ms between items
 */
export const listAnimation = trigger('listAnimation', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(50, [
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);

/**
 * List Stagger Animation (Alternative)
 * Similar to listAnimation but with different timing
 * Stagger delay: 75ms between items for more pronounced effect
 */
export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(15px)' }),
      stagger(75, [
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true }),
    query(':leave', [
      stagger(50, [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-15px)' }))
      ])
    ], { optional: true })
  ])
]);

/**
 * Card Entrance Animation
 * Specifically designed for dashboard cards
 * Combines fade-in with slight scale and slide-up
 */
export const cardEntrance = trigger('cardEntrance', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ])
]);

/**
 * Modal Animation
 * Entrance: Scales up from 95% with fade-in
 * Exit: Scales down to 95% with fade-out
 * Duration: 200ms entrance, 150ms exit
 */
export const modalAnimation = trigger('modalAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
  ])
]);

/**
 * Modal Backdrop Animation
 * Fades in/out the backdrop overlay
 * Duration: 200ms entrance, 150ms exit
 */
export const backdropAnimation = trigger('backdropAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0 }))
  ])
]);

/**
 * Modal Slide Up Animation
 * Alternative modal animation that slides up from bottom
 * Better for mobile experiences
 */
export const modalSlideUp = trigger('modalSlideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(100%)' }),
    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(100%)' }))
  ])
]);

/**
 * Table Row Animation
 * Subtle animation for table rows
 * Stagger delay: 30ms for faster cascading
 */
export const tableRowAnimation = trigger('tableRowAnimation', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(-10px)' }),
      stagger(30, [
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ], { optional: true })
  ])
]);

/**
 * Expand/Collapse Animation
 * Used for expandable sections, accordions, etc.
 */
export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate('250ms ease-out', style({ height: '*', opacity: 1 }))
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate('200ms ease-in', style({ height: 0, opacity: 0 }))
  ])
]);

/**
 * Scale Animation
 * Elements scale up from 90% to 100%
 * Good for buttons, icons, and interactive elements
 */
export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.9)' }),
    animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

/**
 * Rotate Animation
 * 180-degree rotation with fade
 * Useful for icons and indicators
 */
export const rotate = trigger('rotate', [
  transition('* => *', [
    animate('200ms ease-in-out')
  ])
]);

/**
 * Success Animation
 * Celebratory animation for successful actions
 * Combines scale and bounce effect
 */
export const successAnimation = trigger('successAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.5)' }),
    animate('300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

/**
 * Error Shake Animation
 * Subtle shake effect for error states
 */
export const errorShake = trigger('errorShake', [
  transition('* => error', [
    animate('400ms', style({ transform: 'translateX(0)' })),
    animate('100ms', style({ transform: 'translateX(-10px)' })),
    animate('100ms', style({ transform: 'translateX(10px)' })),
    animate('100ms', style({ transform: 'translateX(-10px)' })),
    animate('100ms', style({ transform: 'translateX(10px)' })),
    animate('100ms', style({ transform: 'translateX(0)' }))
  ])
]);

/**
 * Toast Notification Animation
 * Slides in from the right with fade
 */
export const toastAnimation = trigger('toastAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(100%)' }),
    animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
  ])
]);

/**
 * Bounce Animation
 * Playful bounce effect for attention-grabbing elements
 */
export const bounce = trigger('bounce', [
  transition('* => *', [
    animate('600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)')
  ])
]);

/**
 * Route Animation Container
 * Wrapper animation for route transitions
 * Allows child animations to play
 */
export const routeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    group([
      query(':enter', [
        style({ opacity: 0, position: 'absolute', width: '100%' }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ position: 'absolute', width: '100%' }),
        animate('200ms ease-in', style({ opacity: 0 }))
      ], { optional: true })
    ])
  ])
]);

/**
 * Button Press Animation
 * Subtle scale down on press for tactile feedback
 */
export const buttonPress = trigger('buttonPress', [
  transition('* => pressed', [
    animate('100ms ease-in', style({ transform: 'scale(0.95)' }))
  ]),
  transition('pressed => *', [
    animate('100ms ease-out', style({ transform: 'scale(1)' }))
  ])
]);

/**
 * Hover Lift Animation
 * Lifts element slightly on hover
 */
export const hoverLift = trigger('hoverLift', [
  transition('* => hover', [
    animate('200ms ease-out', style({ transform: 'translateY(-4px)' }))
  ]),
  transition('hover => *', [
    animate('200ms ease-in', style({ transform: 'translateY(0)' }))
  ])
]);

/**
 * Glow Animation
 * Adds a glowing effect for emphasis
 */
export const glow = trigger('glow', [
  transition('* => active', [
    animate('300ms ease-out', style({ 
      boxShadow: '0 0 20px rgba(102, 126, 234, 0.5), 0 0 40px rgba(102, 126, 234, 0.3)' 
    }))
  ]),
  transition('active => *', [
    animate('300ms ease-in', style({ 
      boxShadow: 'none' 
    }))
  ])
]);

/**
 * Checkmark Draw Animation
 * Animated checkmark for success states
 */
export const checkmarkDraw = trigger('checkmarkDraw', [
  transition(':enter', [
    style({ strokeDashoffset: 48 }),
    animate('400ms 300ms cubic-bezier(0.65, 0, 0.45, 1)', style({ strokeDashoffset: 0 }))
  ])
]);

/**
 * Progress Bar Animation
 * Smooth progress bar fill
 */
export const progressBar = trigger('progressBar', [
  transition('* => *', [
    style({ width: '0%' }),
    animate('1000ms ease-out', style({ width: '{{width}}%' }))
  ], { params: { width: 100 } })
]);

/**
 * Ripple Effect Animation
 * Material-style ripple effect
 */
export const ripple = trigger('ripple', [
  transition('* => active', [
    style({ 
      transform: 'scale(0)',
      opacity: 0.5
    }),
    animate('600ms ease-out', style({ 
      transform: 'scale(4)',
      opacity: 0
    }))
  ])
]);

/**
 * Notification Badge Animation
 * Bouncy animation for notification badges
 */
export const notificationBadge = trigger('notificationBadge', [
  transition(':enter', [
    style({ transform: 'scale(0)', opacity: 0 }),
    animate('300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
      style({ transform: 'scale(1)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ transform: 'scale(0)', opacity: 0 }))
  ])
]);

/**
 * Skeleton Shimmer Animation
 * Loading skeleton shimmer effect
 */
export const skeletonShimmer = trigger('skeletonShimmer', [
  transition('* => loading', [
    style({ backgroundPosition: '-1000px 0' }),
    animate('2000ms linear', style({ backgroundPosition: '1000px 0' }))
  ])
]);

/**
 * Optimistic Update Animation
 * Subtle fade for optimistic UI updates
 */
export const optimisticUpdate = trigger('optimisticUpdate', [
  transition('* => pending', [
    animate('200ms ease-out', style({ opacity: 0.6 }))
  ]),
  transition('pending => success', [
    animate('300ms ease-in', style({ opacity: 1 }))
  ]),
  transition('pending => error', [
    animate('200ms ease-in', style({ opacity: 1 }))
  ])
]);
