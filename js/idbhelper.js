//=====================================================
// idbhelper.js
// Helper Functions for IndexDB and Other Things
// Note: Some code is redundant with dbhelper.js 
// or RIP from phases 1 or 2 of the project. Due to
// project time contraints, this is left for future
// improvements. 
//=====================================================

// Get Review by Review ID
// From IndexedDB
const getReview = id =>
  idbPromise.then(objStore =>
    objStore
      .transaction(REVIEWS)
      .objectStore(REVIEWS)
      .get(id)
  ); // end of function

// Get All Reviews by Restaurant ID
// From IndexedDB
const getReviews = restaurant_id =>
  idbPromise.then(objStore =>
    objStore
      .transaction(REVIEWS)
      .objectStore(REVIEWS)
      .index("restaurant_id")
      .getAll(restaurant_id)
  ); // end of function

// Get All Reviews
// From IndexedDB
const getAllReviews = () =>
  idbPromise.then(objStore =>
    objStore
      .transaction(REVIEWS)
      .objectStore(REVIEWS)
      .getAll()
  ); // end of function

  // Store Reviews
  // Into IndexedDB
  const addReviews = reviews =>
  idbPromise.then(objStore => {
    const store = objStore
      .transaction(REVIEWS, "readwrite")
      .objectStore(REVIEWS);
    reviews.map(review => {
      store.put(review);
    });
    return reviews;
  }); // end of function

// Get All Restaurantants
// From IndexedDB
const getRestaurantsIDB = () =>
  idbPromise.then(objStore =>
    objStore
      .transaction(RESTAURANTS)
      .objectStore(RESTAURANTS)
      .getAll()
  ); // end of function

// Get Restaurantant by ID
// From IndexedDB
const getRestaurantByIdIDB = id =>
  idbPromise.then(objStore =>
    objStore
      .transaction(RESTAURANTS)
      .objectStore(RESTAURANTS)
      .get(id)
  ); // end of function

// Get Favorite Restaurants
// From IndexedDB
const getFavoriteRestaurantIDB = () =>
  idbPromise.then(objStore =>
    objStore
      .transaction(RESTAURANTS)
      .objectStore(RESTAURANTS)
      .index("is_favorite")
      .get("true")
  ); // end of function

// Update Restaurants
// Into IndexedDB  
const updateRestaurant = restaurant => {
  idbPromise.then(objStore => {
    const store = objStore
      .transaction(RESTAURANTS, "readwrite")
      .objectStore(RESTAURANTS);
    store.put(restaurant);
  });
}; // end of function

// Add Restaurants
// Into IndexedDB  
const addRestaurants = new_restaurants =>
  idbPromise.then(objStore => {
    const store = objStore
      .transaction(RESTAURANTS, "readwrite")
      .objectStore(RESTAURANTS);

    new_restaurants.map(restaurant => {
      store.put(restaurant);
    });
    return new_restaurants;
  }); // end of function


// Add Pending Reviews into IndexedDB
const addPending = request =>
  idbPromise.then(objStore => {
    const store = objStore
      .transaction(UNRESOLVED, "readwrite")
      .objectStore(UNRESOLVED);
    store.add(request);
    return request;
  }); // end of function

// Get Pending Reviews into IndexedDB
const getPending = () =>
  idbPromise.then(objStore =>
    objStore
      .transaction(UNRESOLVED)
      .objectStore(UNRESOLVED)
      .getAll()
  ); // end of function

// Process Pending Reviews
const processPending = () =>
  
  // Get the Pending Reviews from IndexedDB
  idbPromise
    .then(objStore =>
      objStore
        .transaction(UNRESOLVED)
        .objectStore(UNRESOLVED)
        .getAll()
    )
    .then(pendingRequests => {
      // Validate the Review is Good
      if (!pendingRequests || pendingRequests.length < 1) {
        return;
      }
      // Make New Requests for Each Pending Review
      // If there are multiple pending reviews then it will
      // try to POST each review to the RESTful server
      pendingRequests.map(pendingRequest => {
        const request = new Request(pendingRequest.url, {
          method: pendingRequest.method,
          body: JSON.stringify(pendingRequest.body)
        });
        // Fetch the Pending Add Review Request (POST to Server)
        fetch(request)
          .then(res => {
            // If the Response Was Bad Return
            if (!res.ok) return;
            // Response was Good
            // Remove the pending add review transaction
            // from the pending IndexedDB store
            idbPromise.then(objStore => {
              const store = objStore
                .transaction(UNRESOLVED, "readwrite")
                .objectStore(UNRESOLVED);
              store.delete(pendingRequest.id);
            });

            // Return the Response
            return res.json();
          }) // End of First Promise Processing
          .then(entry => {

            /*
            // Update the IndexedDB Again
            idbPromise.then(objStore => {
              const store = objStore
                .transaction(pendingRequest.foreignStore, "readwrite")
                .objectStore(pendingRequest.foreignStore);
              store.delete(pendingRequest.foreignKey);
              if (pendingRequest.method === "DELETE") return;
              store.put(entry);
            });
            */

          }); // end of second promise processing
      });
    }); // end of function to process pending reviews

  // Add the Review into IndexedDB  
  const addReview = review =>
  idbPromise.then(objStore => {
    const store = objStore
      .transaction(REVIEWS, "readwrite")
      .objectStore(REVIEWS);
    store.add(review);
    return review;
  }); // end of function