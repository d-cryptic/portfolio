// Progressive loading utility
document.addEventListener('DOMContentLoaded', () => {
  // Get all elements with the progressive-load class
  const elements = document.querySelectorAll('.progressive-load');
  
  // Set initial styles to prevent FOUC (Flash of Unstyled Content)
  elements.forEach(el => {
    el.style.visibility = 'hidden';
    el.style.animation = 'none';
  });
  
  // Small delay to ensure styles are applied before starting animations
  setTimeout(() => {
    elements.forEach((el, index) => {
      // Set the load order based on element's position in the DOM
      el.style.setProperty('--load-order', index + 1);
      
      // Make element visible and re-enable animation
      el.style.visibility = 'visible';
      el.style.animation = '';
      
      // Add a small delay between animations for a cascading effect
      el.style.animationDelay = `calc(var(--progressive-delay) * ${index + 1})`;
    });
  }, 50);
});
