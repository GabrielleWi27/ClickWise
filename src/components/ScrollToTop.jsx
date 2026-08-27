// React Router keeps the browser's scroll position across navigations by
// default (it's built for restoring scroll on back/forward, not for
// resetting it on a fresh navigation) — without this, clicking a nav link
// while scrolled down on the previous page lands you mid-page on the new
// one instead of at the top.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation(); // the current URL path, e.g. "/training"

  // Every time the URL path changes (i.e. we navigated to a new page),
  // jump the scrollbar back to the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Renders nothing — this component's only job is the effect above.
  return null;
}
