// The "picture frame" every page sits inside: background effects, the top
// navigation bar, and the footer. App.jsx wraps every route with this
// Layout, so you never have to add the nav bar/footer to each page
// individually — whatever page is currently active just appears in the
// middle via <Outlet />.
import { Outlet } from 'react-router-dom';
import GlobalBackground from './GlobalBackground';
import CursorGlow from './CursorGlow';
import Navigation from './Navigation';
import Footer from './Footer';
import PasswordChangeBanner from './PasswordChangeBanner';
import OnboardingTour from './OnboardingTour';
import ScrollToTop from './ScrollToTop';

export default function Layout() {
  return (
    <div className="min-h-screen bg-black text-white print:bg-white print:text-black font-inter relative overflow-x-hidden flex flex-col">
      <ScrollToTop /> {/* resets scroll to the top on every navigation */}
      {/* print:hidden on all the site chrome below — nobody wants a dark
          background, nav bar, or footer wasting ink on a printed report */}
      <GlobalBackground /> {/* the stars/glow behind everything */}
      <CursorGlow /> {/* soft red glow that follows the mouse */}
      <div className="gradient-blur print:hidden" /> {/* fades the background near the top edge */}
      <Navigation /> {/* the top bar with logo, links, sign in/profile */}
      <PasswordChangeBanner /> {/* nudges anyone still on a default password to change it */}
      <OnboardingTour /> {/* first-login welcome popup, once per account */}
      <Outlet /> {/* <-- whichever page's content actually goes here */}
      <Footer />
    </div>
  );
}
