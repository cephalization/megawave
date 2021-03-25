import throttle from 'lodash.throttle';

// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
export const mobileResizer = () => {
  // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
  const vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  const onResize = () => {
    // We execute the same script as before
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  const tOnResize = throttle(onResize, 100);

  // We listen to the resize event
  window.addEventListener('resize', tOnResize);
};
