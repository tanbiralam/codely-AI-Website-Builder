import { useState, useEffect } from "react";

export const useScroll = (threshold = 10) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isScrolled;
};

/**
 * This hook tracks the vertical scroll position of the window and returns
 * a boolean (`isScrolled`) that indicates whether the user has scrolled
 * past a given threshold (default is 10px).
 *
 * - It sets up an event listener on the window's "scroll" event.
 * - On each scroll, it checks if window.scrollY (the vertical offset in px)
 *   is greater than the threshold.
 * - If so, `isScrolled` becomes true; otherwise, false.
 * - The event listener is cleaned up when the component unmounts.
 *
 * Example usage:
 *   const isScrolled = useScroll(50);
 *   // isScrolled will be true once the user scrolls down more than 50px
 */
