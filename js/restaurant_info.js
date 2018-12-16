//=====================================================
// restaurant_info.js
// Helper Functions for Restaurant Details Page
// Note: Some code is redundant with other files
// or RIP from phases 1 or 2 of the project. Due to
// project time contraints, this is left for future
// improvements. 
//=====================================================

// Variables
let restaurant;
var newMap;

// Initialize Map As Page Loads
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});   

// Initializes the Map
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    
    // Error
    if (error) { 
      console.error(error);
    } // end of iff
    
    // Data is Good
    else 
    {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoia2F0aGxlZW53ZXN0IiwiYSI6ImNqajd0amcwcTBlYjczd3AyOGgyOHpnNHgifQ.L_077kPDw_UJUNMvztc83Q',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);

      // Update BreadCrumbs
      fillBreadcrumb();

      // Add Map Marker for Restaurant
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    } // end of if
  });
} // end of function  
 
// Get Restaurant from URL
fetchRestaurantFromURL = (callback) => {

  // If already defined, restaurant already fetched
  if (self.restaurant) { 
    callback(null, self.restaurant)
    return;
  } // end if

  // Restaurant ID
  const id = getParameterByName('id');

  // Catch Invalid URL
  if (!id) { 
    error = 'No restaurant id in URL'
    callback(error, null);
  } // end of if
  
  // URL Is Good
  else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;

      // Catch Invalid Restaurants
      if (!restaurant) 
      {
        console.error(error);
        return;
      } // end of if

      // Fill the HTML on the Page
      fillRestaurantHTML();

      // Respond Back
      callback(null, restaurant)
    });
  } // end of else
} // end of function

// Fill the Restaurant Detail Page HTML
fillRestaurantHTML = (restaurant = self.restaurant) => {

  /******************* Restaurant Name ***************************/
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  /****************** Restaurant Address **************************/
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  var aria_label = document.getElementById('address_label');
  aria_label.innerHTML = "Address: " + restaurant.address;
        
  /***************Restaurant Image *****************************/
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  var imgurlbase = DBHelper.imageUrlForRestaurant(restaurant);
  const imgurl1x = imgurlbase + "_320.jpg";
  const imgurl2x = imgurlbase + "_503.jpg";
  const imgurl3x = imgurlbase + "_900.jpg";
  image.src = imgurl1x;
  image.srcset = `${imgurl1x} 320w, ${imgurl2x} 503w, ${imgurl3x} 900w`;
  image.sizes = `(max-width: 320px) 320px, (max-width: 503px) 503px, 900px`;
  image.alt = restaurant.name + " restaurant marketing photograph";	

  /************** Restaruant Cusine ***************************/
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  var aria_label = document.getElementById('cuisine_label');
  aria_label.innerHTML = "Cuisine: " + restaurant.cuisine_type;

  /************** Restaruant ID ***************************/
  const restaurant_id = document.getElementById('restaurant-id');
  restaurant_id.innerHTML = restaurant.id;
  restaurant_id.style.display == `none`;

  /************** Restaruant Favorite ***************************/
  const favorite = document.getElementById('favorite-button');
  // Identification for the Favorite Button
  favorite.id = "favorite-feature-" + restaurant.id;
  const is_favorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  var temp_text = is_favorite
      ? "is a favorite"
      : "is not a favorite";
  favorite.style.background = is_favorite
      ? `url("/icons/favorite.svg") no-repeat center`
      : `url("icons/notfavorite.svg") no-repeat center`;  
  var aria_label = document.getElementById('favorite_label');
  aria_label.innerHTML = "Favorite Feature: Restaurant" + restaurant.name + temp_text + "Click to change favorite status";
  // Event Handler for the Favorite Button
  // Handle the Event
  favorite.onclick = event => handleFavoriteClick(restaurant, !is_favorite);
  
  /************* Restaurant Hours ****************************/
  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  /************* Restaurant Reviews **************************/
    fillReviewsHTML();
  
} // end of function

// Create Restaurant Hours HTML
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');

  // Loop for each operatinghours record
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    // Create Attitube for Tab Index on Row Only
    var label_tabindex = document.createAttribute("tabindex");       
    label_tabindex.value = 0;
    // Set the attirubte to the row
    row.setAttributeNode(label_tabindex);

    // Aria Labelled By
    var label_attribute = document.createAttribute("aria-labelledby");    
    label_attribute.value = key + "_label";                          
    row.setAttributeNode(label_attribute); 
    
    // Day
    const day = document.createElement('td');
    day.innerHTML = key;                          
    row.appendChild(day);

    // Hours            
    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.appendChild(row);

    // Aria Label for Row That Speaks Day + Hours
    var aria_label = document.createElement('label');
    aria_label.id = key + "_label";
    aria_label.className = "aria-label";
    aria_label.innerHTML = key + operatingHours[key];
      
  } // end of loop for each record
} //  end of function

// Create Reviews Container HTML
fillReviewsHTML = (reviews = self.restaurant.reviews) => {

  // Get all Reviews
  DBHelper.getReviewsByRestaurant(self.restaurant.id, (error, reviews) => 
  {
    // Error Handling
    if (error) return;

    // Add Handler for Add Review Button
    const buttonAddReview = document.getElementById('reviews-add');
    const containerReview = document.getElementById('reviews-add-container');
    var visible = containerReview.style.display == `none` ? false : true;

    // Add Handler for Add Review Submit Button
    const form = document.getElementById("add-review");
    form.addEventListener("submit", handleFormSubmit);

    // Add Aria for Add Review Button
    var aria_label = document.getElementById('reviews_add_label');
    aria_label.innerHTML = "Add Review Button" + " Click to add Review";

    // Add Aria Label for Submit Review Button
    var aria_label = document.getElementById('reviews_submit_label');
    aria_label.innerHTML = "Submit Review Button" + " Click to submit Review";

    // Toggle Visability of the Review Container
    buttonAddReview.onclick = event => handleAddReviewClick(visible);

    // Update Reviews Container
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
  
    // If No Review Data
    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);

      return;
    } // end of if

    const ul = document.getElementById('reviews-list');

    // Create Review HTML for each review
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));      
    });
  
    container.appendChild(ul);
  }); 
} // end of function


// Create Individual Review HTML
createReviewHTML = (review) => {

  // Set Review ID to the Next Random Number
  //var randomNumberBetween0and19999 = Math.floor(Math.random() * 20000);
  var review_id = review.review_id;
  
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const updated = review.updatedAt;
  date.innerHTML = new Date(updated).toLocaleString();
  li.appendChild(date);
  
  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  // Add Tab Index for the List Element
  var label_tabindex = document.createAttribute("tabindex");       
  label_tabindex.value = 0;
  // Set the attirubte to the row
  li.setAttributeNode(label_tabindex);

  // Add Aria LabelledBy Attribute for Review
  var label_attribute = document.createAttribute("aria-labelledby");    
  label_attribute.value = review_id + "_label";                         
  li.setAttributeNode(label_attribute); 

  // Add Aria Label for Single Review
  var aria_label = document.createElement('label');
  aria_label.id = review_id + "_label";
  aria_label.className = "aria-label";
  aria_label.innerHTML = "Rating " + review.rating + " stars. Date " + review.date + ". Reviewed By " + review.name + ". Comments: " + review.comments;

  li.appendChild(aria_label);

  return li;
} // end of create Review HTML


// Add restaurant name to the breadcrumb navigation menu
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement("a");
  a.href = window.location; 
  a.innerHTML = restaurant.name;
  a.setAttribute("aria-current", "page");
  li.appendChild(a);
  breadcrumb.appendChild(li);
} // end of function

// Get Parameter by Name from URL
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
} // end of function

// Handle the Favorite Feature Click
const handleFavoriteClick = (restaurant, newState) => {

  // If Invalid
  if (!restaurant)
    return;
    
  // Update properties of the restaurant data object
  const favorite = document.getElementById("favorite-feature-" + restaurant.id);
  restaurant["is_favorite"] = newState;
  // Add New Event Handler
  favorite.onclick = event => handleFavoriteClick(restaurant, !restaurant["is_favorite"]);
  //Update the Databases
  DBHelper.handleFavoriteClick(restaurant.id, restaurant, newState);

}; // end of function

// Handle the Add Review Click
const handleAddReviewClick = (newState) => {

  const containerReview = document.getElementById('reviews-add-container');
 
  // Manages the Visability of the Review Form Container
  if (newState) // Make visible
  {
    containerReview.style.display = `flex`;
  } // end of if

  // Make Invisible
  else
  {
    containerReview.style.display = `none`;
  } // end of else
  
  // Toggle Visability of the Review Container
  const buttonAddReview = document.getElementById('reviews-add');

  // Add New Event Handler
  buttonAddReview.onclick = event => handleAddReviewClick(!newState);
  
}; // end of function