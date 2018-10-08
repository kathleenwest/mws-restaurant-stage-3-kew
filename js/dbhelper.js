//=====================================================
// dbhelper.js
// Helper Functions for IndexDB and Other Things
// Note: Some code is redundant with idbhelper.js 
// or RIP from phases 1 or 2 of the project. Due to
// project time contraints, this is left for future
// improvements. 
//=====================================================

// IndexedDB Helper Functions 
var idbApplication = (function() {

  'use strict';

  // Check for Browser Support
  if (!('indexedDB' in window)) {
    console.log('This browser does not support IndexedDB');
    return;
  }

  // Creates the IndexedDB Stores
  const dbPromise = idb.open("udacity-restaurant", 3, upgradeDB => {
      switch (upgradeDB.oldVersion) {
        case 0:
          upgradeDB
            .createObjectStore("restaurants", { keyPath: "id" })
            .createIndex("is_favorite", "is_favorite");
        case 1:
          upgradeDB
            .createObjectStore("reviews", { keyPath: "id" })
            .createIndex("restaurant_id", "restaurant_id");
        case 2:
          upgradeDB.createObjectStore("pending", {
            keyPath: "id",
            autoIncrement: true
          });
      }
    });

  // Stores the Restaurant Data into IndexedDB Existing Databases
  function storeRestaurants() {
    
    // URL to Restaurants API Endpoint
    let fetchURL= DBHelper.DATABASE_RESTAURANTS_URL;
  
    // fetch the restaurants
    fetch(fetchURL)
    // make the response JSON data
    .then(function (response) {
      return response.json();
      })
    // put the JSON data in restaurants IndexDB 
    .then (function(restaurants){
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        restaurants.forEach(function (restaurant) {
          store.put(restaurant)  
        });
      });
      // now return it
      callback(null, restaurants);
      })
    .catch(function (err) {
        const error = (`Unable to store restaurants data ${err}`);
      });   
  } // end of function

  // Stores the Reviews Data into IndexedDB Existing Databases
  // Relevent to Phases 1 and 2 Only
  function storeReviews() {

    // URL to Endpoint to Get All Reviews
    let fetchURL= DBHelper.DATABASE_REVIEWS_URL;

    // fetch all the reviews then place in the IndexedDB
    fetch(fetchURL)
    // make the response JSON data
    .then(function (response) {
      return response.json();
      })
    // put the JSON data in reviews  
    .then (function(reviews){
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('reviews', 'readwrite');
        var store = tx.objectStore('reviews');
        reviews.forEach(function (review) {
          store.put(review)  
        });
      });
      // now return it
      callback(null, reviews);
      })
    .catch(function (err) {
        const error = (`Unable to store reviews data ${err}`);
      }); 

     } // end of function
     
  // Returns all Favorite Restaurants in the IndexedDB database  
  function getFavoriteRestaurants() {
    return dbPromise.then(objStore =>
      objStore
        .transaction('restaurants')
        .objectStore('restaurants')
        .index("is_favorite")
        .get("true")
    );
  } // end of function

  // Returns all the Restaurants in the IndexedDB database
  function getRestaurants() {
    return dbPromise.then(function(db) {
      var tx = db.transaction('restaurants', 'readwrite');
      var store = tx.objectStore('restaurants');
      return store.getAll();
    });
   } // end of function

  // Properties for idbApplication function helpers
  return {
    dbPromise: (dbPromise),
    storeRestaurants: (storeRestaurants),
    getRestaurants: (getRestaurants),
    getFavoriteRestaurants: (getFavoriteRestaurants),
    storeReviews: (storeReviews)
  };
})(); // End of IndexIDB Application Functions


// Common database helper functions.
class DBHelper {

  // RESTful Endpoint Get all restaurants
  static get DATABASE_RESTAURANTS_URL() {
    const port = 1337; // Change this to your data server port
    return `http://localhost:${port}/restaurants`;
  }

  // RESTful Endpoint Get all restaurant reviews
  static get DATABASE_REVIEWS_URL() {
    const port = 1337; // Change this to your data server port
    return `http://localhost:${port}/reviews`;
  }
  
  // Fetch Restaurants
  static fetchRestaurants(callback) {

    // Try to Get the Restaurants from IndexedDB database first
    idbApplication.getRestaurants().then(function(restaurants){
      return restaurants;
    });

    // If no restaurants in IndexDB
    // Try to Fetch, Then Store in IndexedDB

    let fetchURL= DBHelper.DATABASE_RESTAURANTS_URL;

    fetch(fetchURL, {method: "GET"}).then(response => {
      response
        .json()
        .then(restaurants => {
          callback(null, restaurants);
        });
    }).catch(error => {
      const message = (`Request failed. Returned status of ${error.message}`);
      callback(message, null);
    });
} // end of method

  // Fetch all the Neighborhoods
  static fetchNeighborhoods(callback) {

    // Try to Get the Neighborhoods from IndexDB first
    idbApplication.getRestaurants().then(function(restaurants){
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

      return fetchedNeighborhoods;
    }); // end of function

    // If no restaurants in IndeedxDB
    // Try to Fetch, Then Store in IndexedDB

    let fetchURL= DBHelper.DATABASE_RESTAURANTS_URL;

    fetch(fetchURL, {method: "GET"}).then(response => {
      response
        .json()
        .then(restaurants => {

        // Store the Restaurants in IndexDB
        idbApplication.storeRestaurants();

        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
          
        callback(null, fetchedNeighborhoods);
        });
    }).catch(error => {
      const message = (`Request failed. Returned status of ${error.message}`);
      callback(message, null);
    }); // end of fetch
  } // end of method

  // Fetch Restaurant by ID
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  } // end of method

  // Fetch Reviews by Restaurant ID
  // Phase 3 Relevent
  static getReviewsByRestaurant(id, callback) 
  {
      // Validate the Restaurant ID
      if (!Number.isInteger(Number(id))) {
        // If the id is invalid return with error.
        callback(new Error(`ID: ${id} is not a valid id.`), null);
      } // end of is
  
      // Fetch the review from the server.
      DBHelper.goGet(`${DBHelper.DATABASE_REVIEWS_URL}/?restaurant_id=${id}`,"Error fetching reviews for restaurant: ")
        .then(reviews => {
          callback(null, reviews);
        })
        .catch(err => {
          callback(err, null);
        });
  } // end of method

  // Helper Method to Fetch Review from Server
  static goGet(url = "", errorMessage = "Error: ") {

      // Verify URL is Formatted Correctly
      if (url.length < 7) {
        return new Promise((resolve, reject) => {
          reject(`Url: ${url} is invalid.`);
        });
      } // end of if
  
      return fetch(url)
        .then(res => {
          if (!res.ok) {
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .catch(err => {
          return err;
        });
  } // end of method

  // Fetch Restaurants by Cuisine
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  } // end of method

  // Fetch Restaurants by Neighborhood
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  } // end of method

  // Fetch Restaurants by Cuisine and Neighborhood
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  } // end of method

  // Fetch All Cuisines
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  } // end of method

  // Return Restaurant URL
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  } // end of method

  // Return Restaurant Image URL
  static imageUrlForRestaurant(restaurant) {  
    if (restaurant.photograph) {
      return `/img/${restaurant.photograph}`;
    }
    return `/img/${restaurant.id}`
  } // end of method

  // Map Marker for Restaurants
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } // end of method

  // Favorite Processor
  // Handle Favorite Click with IDB and Put to Server
  static handleFavoriteClick(id, restaurant, newState) {

    // Disable Favorite Button 
    let favButton = document.getElementById("favorite-feature-" + id);
    favButton.disabled = true;   
  
    // Update the button background for the specified favorite
    const favorite = document.getElementById("favorite-feature-" + id);
    favorite.style.background = newState
      ? `url("/icons/favorite.svg") no-repeat center`
      : `url("icons/notfavorite.svg") no-repeat center`;
      
    // update IndexedDB first
    idbApplication.dbPromise
    .then(function(db) {
      let tx = db.transaction("restaurants", 'readwrite');
      let store = tx.objectStore("restaurants");
      store.put(restaurant);
    });

        // Verify it Worked
        // This was added for debugging purposes
        // Future: RIP
        idbApplication.dbPromise
        .then(function(db) {
          let tx = db.transaction("restaurants", 'readwrite');
          let store = tx.objectStore("restaurants");
          store.get(id).then(restaurant =>
            {
              //console.log("Verify store IDB for " + restaurant.name + " to " + restaurant.is_favorite);
            });                  
        });

  // Update on Server
  DBHelper.updateFavoriteAPI(id, newState);

  // Enable Favorite Button
  favButton.disabled = false;  // reenable onclick event
 
  }// end of method

  // Favorite Feature API Interactions
  // Online, Offline, and Failed Fetch Support
  // Store in local storage until the online event triggers
  static updateFavoriteAPI(restaurantID, is_favorite) {

    // PUT URL for the RESTful endpoint
    let putURL = `${DBHelper.DATABASE_RESTAURANTS_URL}/${restaurantID}/?is_favorite=${is_favorite}`;

    // If Not Online Place in Storage
    if (!navigator.onLine) {
      // Place in Local Storage for Later
      DBHelper.storeFavoriteTillOnline(restaurantID, putURL);
    } // end of if

    // Update the Server
    else {
      return new Promise(function(resolve, reject) {
        fetch(putURL, {method: 'PUT'})
          .then(() => {
            resolve(true);
          })
          .catch((err) => {           
          });
        });
    } // end of else
  } // end of method

  // Favorite Feature 
  // Store Until Online
  static storeFavoriteTillOnline(restaurantID, putURL) {

    // Place Item in Local Storage
    localStorage.setItem(`${restaurantID}_fav`, putURL);

    // add event listener for when back online
    window.addEventListener('online', event => {
      // get from local storage and update API
      DBHelper.moveLocalStorageToAPI();
    }); // end of event listner
  } // end of method

  // Move Local Stored Data to PUT through Restful API
  static moveLocalStorageToAPI() {
    let favURL = "";
    let revURL = "";
    let id = 0;
    let action = "";

    Object.keys(localStorage).forEach( key => {
      id = key.substring(0, key.indexOf("_"));
      action = key.substring(key.indexOf("_")+1);

      if (action === "fav") {
        favURL = localStorage.getItem(key);
        // Update
        fetch(favURL, {method: 'PUT'});
      } //end of if

      // The offline review was actually implemented differently through IndexedDB
      // This code is here for future improvements/changes
      if (action === "rev") {
        revURL = localStorage.getItem(key);
        DBHelper.putReviewInAPI(JSON.parse(revURL));
      } // end of if

    });

    // Remove all items from local storage
    Object.keys(localStorage).forEach( key => {
      localStorage.removeItem(key);
    }); // end of removal method
  } // end of method

  // Helper Method for Pending Reviews      
  static getPendingDB() {
    return getPending();
  }

  // Process Pending Reviews
  static async processPendingDB() {
    await processPending();
  } 

  // Add Review to IndexedDB and Server
  static addReview(review, callback) {

    // special formating for review
    // for future improvements
    const idbReview = {
      ...review
    };

    // Add Review to IndexedDB
    addReview(idbReview)
      .then(storedReview => {

        // Add Review to RESTful Server
        DBHelper.goPost(
          DBHelper.DATABASE_REVIEWS_URL,
          review,
          "Error posting review: "
        )
        // Process the Review
        .then(res => {
          // Offline: Add the Review to IndexedDB pending database
          if (res == undefined || !res.ok) {
            // Setup Review Object for Storage
            const pendingReview = {
              foreignKey: storedReview.id,
              foreignStore: "reviews",
              method: "POST",
              url: DBHelper.DATABASE_REVIEWS_URL,
              body: review
            };
            // Add to IndexedDB Pending
            addPending(pendingReview).then(pending => {
              callback(pending, res);
            })
            .catch(err => {
              callback(err, null);
            });
          } //end of if

          // Online: Posted to RESTful Server
          // Skip add to pending IndexedDB store
          else
          {
            // Everything is Beautiful 
            callback(null, res.json());
          } // end of else

        }); // end of promise processing
      })
      .catch(err => {
        // Failed to add to indexedDB just abort
        callback(err, null);
      });
  } // end of method

  // Post the Review to the Restful Server
  static goPost(url = "", data = {}, errorMessage = "Error: ") {

    // Validate the POST Url
    if (url.length < 7 || Object.keys(data).length === 0) {
      return new Promise((resolve, reject) => {
        if (url.length > 7) {
          reject(`Url provided ${url}, is invalid`);
        } else {
          reject(`Provided an empty object to post.`);
        }
      });
    } // end of if

    // Try Posting the Review
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(data)
    })
      .then(res => {
        // If the Response is Bad 
         if (!res.ok || res.status > 300) {
          throw new Error(res.statusText);
        }
        return res;
      }) // end of promise processing
      .catch(err => {
        return err;
      });
  } // end of method

} // end of class


