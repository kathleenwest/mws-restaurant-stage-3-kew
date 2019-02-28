# mws-restaurant-stage-3-kew

Project Blog Article: https://portfolio.katiegirl.net/2018/12/16/restaurant-reviews-app-stage-3/

-----------------------------
Stage 3 Notes:
-------------------------------------
Responsive Testing:

Responsive Images were designed for a DPR setting of 1.0. When testing under Google Chrome Tools make sure your DPR setting is set to 1.0.
-------------------------------------
Accessibility: Google Maps was hidden the Accessibility Tree but I added the application role per guidance of my mentor. 
-------------------------------------
Maps API

I switched from Google to Leaflet with MapBox for free. Get your own access token for free here: https://www.mapbox.com
-------------------------------------
Functionality

User Interface:

Users are able to mark a restaurant as a favorite, this toggle is visible in the application. A form is added to allow users to add their own reviews for a restaurant. Form submission works properly and adds a new review to the database.

Offline Use

The client application works offline. JSON responses are cached using the IndexedDB API. Any data previously accessed while connected is reachable while offline. User is able to add a review to a restaurant while offline and the review is sent to the server when connectivity is re-established.
-------------------------------------
Responsive Design and Accessibility

Responsive Design

The application maintains a responsive design on mobile, tablet and desktop viewports. All new features are responsive, including the form to add a review and the control for marking a restaurant as a favorite.

Accessibility

The application retains accessibility features from the previous projects. Images have alternate text, the application uses appropriate focus management for navigation, and semantic elements and ARIA attributes are used correctly. Roles are correctly defined for all elements of the review form.
-------------------------------------
Performance

Site Performance

Lighthouse targets for each category exceed:

Progressive Web App: >90
Performance: >90
Accessibility: >90
-------------------------------------
Known Issues

There is an existing Google Chrome browser bug that shows an error when loading the site icon "favicon.ico" while in Offline mode (no network). The error message is shown below as seen in the console log window:

:8000/favicon.ico:1 GET http://localhost:8000/favicon.ico net::ERR_INTERNET_DISCONNECTED
An unknown error occurred when fetching the script.
Failed to load resource: net::ERR_INTERNET_DISCONNECTED

Google Chromium team is aware and addressing the browser bug in an upcoming software update:
https://bugs.chromium.org/p/chromium/issues/detail?id=448427#c16
 

