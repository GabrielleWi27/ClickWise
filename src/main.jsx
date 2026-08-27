// The very first file that runs. It finds the empty <div id="root"> in
// index.html and tells React to render the whole app inside it.
import { StrictMode } from 'react' // extra dev-only checks to catch bugs early
import { createRoot } from 'react-dom/client' // React 19's way of starting up in the browser
import { BrowserRouter } from 'react-router-dom'
import './index.css' // global styles (Tailwind + custom CSS)
import App from './App.jsx' // the app's routes live here

// Find the empty <div id="root"> from index.html and mount the app into it.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter turns on page navigation via the URL (React Router) */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
