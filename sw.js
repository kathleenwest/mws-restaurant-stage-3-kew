//=====================================================
// sw.js
// Service Worker
// The Website Manager Boss
// Note: Some code is redundant with other files 
// or RIP from phases 1 or 2 of the project. Due to
// project time contraints, this is left for future
// improvements. 
//=====================================================

// Import Scripts into Global Scope
self.importScripts('/js/idbhelper.js');
self.importScripts('/js/idb.js');

// IndexedDB Variable Names
const IDB_NAME = "udacity-restaurant";
const RESTAURANTS = "restaurants";
const REVIEWS = "reviews";
const UNRESOLVED = "pending";

// Promise for IndexedDB
const idbPromise = idb.open(IDB_NAME, 3, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB
        .createObjectStore(RESTAURANTS, { keyPath: "id" })
        .createIndex("is_favorite", "is_favorite");
    case 1:
      upgradeDB
        .createObjectStore(REVIEWS, { keyPath: "id" })
        .createIndex("restaurant_id", "restaurant_id");
    case 2:
      upgradeDB
      .createObjectStore("pending", { keyPath: "id", autoIncrement: true });
  }
}); // end of function

// Define the Caches
var staticCacheName = 'mws-restaurant-static-v';
// Set Get Random number for Cache ID 
//var randomNumberBetween0and19999 = Math.floor(Math.random() * 20000);
//var cache_id = randomNumberBetween0and19999;
//staticCacheName += cache_id;

// After Service Worker Installs Do This
self.addEventListener("install", function(event) {

  event.waitUntil(
     // Store the Cache
    caches.open(staticCacheName).then(function(cache) {
    return cache.addAll([
      "/",
      "index.html",
      "restaurant.html",
      "favicon.ico",
      "/css/main.css",
      "/css/responsive.css",
      "/js/dbhelper.js",
      "/js/main.js",
      "/js/idbhelper.js",
      "/js/restaurant_info.js",
      "/img/",
      "/js/idb.js",
      "/js/review.js",
      "/js/register.js"
    ])
    .catch(error => {    
    });
  })); // end of event function
}); // end of event listener function

// After the Service Worker Activates Do This
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-restaurant-') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
}); // end of function

// Fetch Events 
self.addEventListener('fetch', 
function(event) 
{

  // Handle Any Request Not GET (Example POST)
  if (event.request.method !== "GET") 
  {

    // If Offline Return  
    if (!navigator.onLine) {

      // Return a Response and Error
      var init = { "status" : 303 , "statusText" : "Offline cannot fetch" };
      event.respondWith(new Response(null, init));
      return new Error("Offline, cannot post");

    } // end of iff
    
    // Normal Response Handing by Fetch (Example: Post)
    event.respondWith(fetch(event.request)
    .catch(err => {
      return err;
    })
    ); // end of response

    return;

  } // end of if not GET

  // Event URL Request
  const eventUrl = new URL(event.request.url);

  // Filter out RESTful Server Requests
  if (eventUrl.port === "1337") {
  
    // Restaurant GET Request
    if (eventUrl.pathname.split("/").filter(path => path === "restaurants").length > 0) {    
      handleRestaurantRequest(event);
      return;
    } // end of if
    
    // Review GET Request
    else {   
      handleReviewRequest(event);
      return;
    } // end of else

  } // end of filtering RESTful Server Requests

  // Handle All Other Requests
  event.respondWith
  (  
    // First Try to Server from Cache  
    caches.match(event.request)
    .then
    (
      function(response) 
      {
        // Found and Serving from Cache
        if (response !== undefined) 
        {   
          return response;
        } // end of if 
      
        // Not Found in Cache, Fetching from Internet
        else 
        { 
          // Check to see if online first
          if (!navigator.onLine) {
            // Cannot access the internet
            // Return custom response
            var init = { "status" : 500 , "statusText" : "Offline" };
            const customresponse = new Response(null,init);
            return customresponse;
          } // end of if
          
          return fetch(event.request).then
          (
            // Add to Cache  
            function (response) 
              {
                let responseClone = response.clone();
                
                caches.open(staticCacheName)
                .then
                (
                  function (cache) 
                  {
                    cache.put(event.request, responseClone);
                  }
                );
                return response;
              }
          ); // end of fetch promise processing
        } // end of else
      } // end of function
    ) // end of promise for cache match
  ); // end of respond with
} // end of function
); // end of event listener for fetch

// Sorts the Reviews and Returns
const sort = reviewArray => {
  return reviewArray.sort((a, b) => {
    if (a.updatedAt > b.updatedAt) {
      return -1;
    }
    if (a.updatedAt < b.updatedAt) {
      return 1;
    }
    return 0;
  });
}; // end of function

// Handles the Restaurant Requests for Restful Server
const handleRestaurantRequest = event => {

  // URL for RESTful request
  const eventUrl = new URL(event.request.url);

  // Is favorite request?
  // Get favorites http://localhost:1337/restaurants/?is_favorite=true
  if (eventUrl.searchParams.get("is_favorite")) {
     
    // Return Favorite Restaurant
    getFavoriteRestaurant(event);
    return;
  } // end of if

  // Get Restaurant by ID
  if (eventUrl.pathname.split("/").filter(path => Number(path) > 0).length > 0) {
    
    // Get by id http://localhost:1337/restaurants/1
    let id = eventUrl.pathname.split("/").filter(path => Number(path) > 0);
    id = Number(id[0]);
    // Get Restaurant by ID
    getRestaurantById(event, id);
    return;
  }

  // Get All Restaurants
  // Get all http://localhost:1337/restaurants
  getRestaurants(event);

}; // end of function

// Get Favorite Restaurant
const getFavoriteRestaurant = event => {
  event.respondWith(
    getFavoriteRestaurantIDB().then(data => {
      // See if data was returned.
      if (data.length > 0) {
        return new Response(JSON.stringify(data));
      } // end of if

      // No data in IndexedDB, Fetch and then Cache
      return fetchAndCacheRestaurants(event).then(json => {
        return new Response(JSON.stringify(json));
      });
    })
  );
}; // end of function

// Get All Restaurants
// First Try IndexedDB, then Fetch
const getRestaurants = event => {
  
  event.respondWith(
    getRestaurantsIDB().then(data => {
      // See if data was returned.
      if (data.length > 0) {
        return new Response(JSON.stringify(data));
      } // end of if
      
      // No data in IndexedDB, Fetch and then Cache
      return fetchAndCacheRestaurants(event).then(newdata => {
        return new Response(JSON.stringify(newdata));
      });
    })
  );
}; // end of function

// Get Restaurant by ID
// First Try IndexedDB, then Fetch
const getRestaurantById = (event, id) => {
  event.respondWith(
    getRestaurantByIdIDB(id).then(data => {
      // See if data was returned.
      if (data && Object.keys(data).length !== 0 && data.constructor === Object) {
        return new Response(JSON.stringify(data));
      } // end of if

      // No data in IndexedDB, Fetch and then Cache
      return fetchAndCacheRestaurants(event).then(newdata => {
        return new Response(JSON.stringify(newdata));
      });


    })
  );
}; // end of function

// Fetch and Cache Restaurants
const fetchAndCacheRestaurants = event =>
{
  
    // Fetch and cache.
    return fetch(event.request)
      .then(res => res.json())
      .then(json => {
        if (!Array.isArray(json)) {
          addRestaurants([json]);
        } // end of if

        else {
          addRestaurants(json);
        } // end of else
        
        return json;
      });
  
}; // end of function

// Handle Review Restful Requests
const handleReviewRequest = event => {

  // Review URL
  const eventUrl = new URL(event.request.url);

  // Request: Get Review by Review ID
  if (eventUrl.pathname.split("/").filter(path => Number(path) > 0).length > 0) {
    
    let id = eventUrl.pathname.split("/").filter(path => Number(path) > 0);
    id = Number(id[0]);

    event.respondWith(
      // Fetch and Cache
      fetchAndCacheReviews(event).then(json => {
        return new Response(JSON.stringify(json));
      })
    );
    return;
  } // end of if get review by ID

  // Request: Get Reviews by Restaurant ID
  if (eventUrl.searchParams.get("restaurant_id")) {

    // Request RESTful URL
    let id = eventUrl.searchParams.get("restaurant_id");
    id = Number(id[0]);

    event.respondWith(
      getReviews(id)
      .then(data => {
        // See if data was returned.
        if (data.length > 0) {
          return new Response(JSON.stringify(sort(data)));
        } // end of if

        // No data in IndexedDB, Fetch and then Cache
        return fetchAndCacheReviews(event).then(json => {
          return new Response(JSON.stringify(sort(json)));
        });
      })
    ); // end of response

    return;

  } // end of if

  // Default: Return All Reviews
  event.respondWith(
    getAllReviews().then(data => {
      // See if data was returned.
      if (data.length > 0) {
        return new Response(JSON.stringify(sort(data)));
      }

      // No data in IndexedDB, Fetch and then Cache
      return fetchAndCacheReviews(event).then(json => {
        return new Response(JSON.stringify(sort(json)));
      });
    })
  ); // end of response
}; // end of function
    
// Fetch and Cache Reviews into IndexedDB    
const fetchAndCacheReviews = event =>
  fetch(event.request)
    .then(res => res.json())
    .then(json => {
      if (!Array.isArray(json)) {
        addReviews([json]);
      } // end of if

      else {
        addReviews(json);
      } // end of else

      return json;
    }
  ); // end of function
