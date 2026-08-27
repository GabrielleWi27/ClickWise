// This file describes the 3 subscription plans a company can be on.
// Everything about pricing/seat limits lives here in ONE place, so if you
// ever want to change a price or how many employees a plan allows, this is
// the only file you need to edit — every page that shows pricing reads from here.
export const PLANS = [
  {
    id: 'starter', // unique key used everywhere else to refer to this plan
    name: 'Starter',
    description: 'Ideal for small teams looking to baseline human risk.',
    priceKsh: 2500, // monthly price in Kenyan Shillings
    recommended: false, // shows the "Recommended" badge on the pricing page when true
    seatLimit: 100, // max number of members (admins + employees) this plan allows
    features: ['Up to 100 Employees', 'Monthly Phishing Tests', 'Core Training Module'],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced automation for high-growth organizations.',
    priceKsh: 7500,
    recommended: true,
    seatLimit: 1000,
    features: ['Up to 1,000 Employees', 'AI-Driven Campaigns', 'Targeted Adaptive Training', 'Risk Scoring API'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-spectrum security for large-scale enterprises.',
    priceKsh: 20000,
    recommended: false,
    seatLimit: Infinity, // Infinity = no member limit at all
    features: ['Unlimited Users', 'Dedicated Success Manager', 'Custom Compliance Reports'],
  },
];

// Look up a plan by its id. If the id doesn't match anything (or is missing),
// fall back to the "Professional" plan (index 1) so the app never crashes
// trying to show plan details for a company with no plan set yet.
export function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) ?? PLANS[1];
}

// Turns a plain number like 64000 into a nicely formatted price string
// like "64,000" using Kenyan number formatting (comma every 3 digits).
export function formatKsh(amount) {
  return new Intl.NumberFormat('en-KE').format(amount);
}
