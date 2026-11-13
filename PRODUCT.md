# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Event committee members at campuses and student organizations. They run events of roughly 100 to 2,000 people, start from a proposal PDF, and must find, compare and book vendors themselves on a limited budget, usually without procurement experience. Confirmed: the landing page's visitor is this committee member; EO professionals are not the target.

## Product Purpose
Venditores handles vendor procurement for an event, from the proposal PDF to the day of the event. Gemini reads the proposal, lists the vendors the event needs and splits the budget. The committee then picks vendors (admin-recommended with reviews, or searched online), compares offers, and watches risk from a dashboard. Success on the landing page: the visitor signs up and uploads a first proposal.

## Positioning
It starts from the proposal the committee already has, not from a blank vendor search. One mechanism chains the whole job: proposal to vendor needs to budget split to scored offers (60% spec fit read by AI, 40% price, cheaper scores higher).

## Operating Context
Proposal PDFs go in; per-event vendor needs with allocated budget, procurement status steps, quotes per need, and a risk level per event come out. Admin users manage a recommended vendor directory; users rate vendors they worked with. AI use is rate-limited.

## Capabilities and Constraints
- Stack: Laravel, Inertia, React, TypeScript, Tailwind v4. Hosted at venditores.fsd.my.id.
- Currency is Rupiah (`Rp150.000.000` format).
- Landing page language: English, matching the app UI.
- Existing app UI is glassmorphism on a pale mesh; brand blue `#244CFF`, ink `#17191D`, paper `#E8EBED` (confirmed by the user as the direction to keep).
- Landing page auth state: shows Dashboard when logged in, Log in / Sign up otherwise.

## Brand Commitments
Name "Venditores". Logo mark is the existing `AppLogoIcon` (a V). Blue `#244CFF` is the brand color. Glassmorphism is a standing user direction for the whole product. No university, course or team credit text anywhere on the page (the user had it removed).

## Evidence on Hand
No customers, testimonials, benchmarks or pricing exist; none may be invented. Demonstration material (example events, vendors, budgets, scores) is allowed only when labelled as an example. Real facts available: the feature set above and the scoring formula.

## Product Principles
- Start from the proposal the committee already has.
- Show the mechanism working on a real-looking example instead of describing it.
- Money is concrete: always Rupiah, always sums that add up.
- The committee decides; AI proposes and scores, and says how.

## Accessibility & Inclusion
No product-specific standard established; hold to WCAG AA contrast and visible focus, and respect reduced motion.
