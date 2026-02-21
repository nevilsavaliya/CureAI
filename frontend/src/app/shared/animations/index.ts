/**
 * Animation Library Index
 * 
 * This file exports all animation triggers for easy importing throughout the application.
 * 
 * Usage:
 * import { pageTransition, listAnimation, modalAnimation } from '@app/shared/animations';
 * 
 * Then add to component decorator:
 * @Component({
 *   animations: [pageTransition, listAnimation]
 * })
 */

export {
  // Page and route animations
  pageTransition,
  routeAnimation,
  
  // Basic animations
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  scaleIn,
  rotate,
  bounce,
  
  // List and collection animations
  listAnimation,
  listStagger,
  tableRowAnimation,
  
  // Card animations
  cardEntrance,
  
  // Modal animations
  modalAnimation,
  backdropAnimation,
  modalSlideUp,
  
  // Utility animations
  expandCollapse,
  
  // Feedback animations
  successAnimation,
  errorShake,
  toastAnimation
} from './page-animations';
