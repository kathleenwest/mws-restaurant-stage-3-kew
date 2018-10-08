//=====================================================
// main.js
// Helper functions to handle to loading of data
// and creation of HTML for the index.html page
//=====================================================

// Variables
let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

// When Document is Loaded
document.addEventListener('DOMContentLoaded', (event) => {
  // Initialize the Map
  initMap(); 

  // Fetch the Neighborhoods
  fetchNeighborhoods();

  // Fetch the Cuisines
  fetchCuisines();
}); // end of event listener

// Fetch All Neighborhoods and Set HTML
fetchNeighborhoods = () => {

  // Fetch Neighborhoods
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    
    // If Error
    if (error) { // Got an error
      console.error(error);
    } // end of if
    
    // If Good
    else {
      self.neighborhoods = neighborhoods;
      // Fill the HTML
      fillNeighborhoodsHTML();
    } // end of else
  }); // end of function

} // end of function

// Set Neighborhoods HTML
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  // For Each Neighborhood, Update HTML
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
} //end of function

// Fetch All Cuisines and Set HTML
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
} //end of function

// Fill Cuisines in HTML
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  // For Each Cuisine, Update HTML
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
} // end of function

// Initialize Leaflet map, called from HTML.
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
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

  // Update the Restaurants on the Map and in HTML
  updateRestaurants();

} // end of function

// Update Page and Map for All Restaurants
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    
    // Error Fetching Restaurants
    if (error) { 
      console.error(error);
    } 
    
    // Everything is Good
    else {

      // Removal of Old Data on Page
      resetRestaurants(restaurants);

      // Update the HTML for all Restaurants
      fillRestaurantsHTML();
    }
  }); // end of function
} // end of function

// Clean Previous Restaurant Data on Page and Map
resetRestaurants = (restaurants) => {

  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  } // end of if

  self.markers = [];
  self.restaurants = restaurants;

} // end of function

// Update HTML with All Restaurant Data
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  // Add to HTML
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  // Add to Map
  addMarkersToMap();
} // end of function

// Create HTML to Add Restaurants to Page
createRestaurantHTML = (restaurant) => {

  // Each Restaurant is a List Element
  const li = document.createElement('li');

  /************** Restaurant Image ***************************/
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  var imgurlbase = DBHelper.imageUrlForRestaurant(restaurant);
  const imgurl1x = imgurlbase + "_320.jpg";
  const imgurl2x = imgurlbase + "_503.jpg";
  const imgurl3x = imgurlbase + "_900.jpg";
  image.src = imgurl1x;
  image.srcset = `${imgurl1x} 320w, ${imgurl2x} 503w, ${imgurl3x} 900w`;
  image.sizes = `(max-width: 503px) 320px, (max-width: 900px) 503px, 900px`;
  image.alt = restaurant.name + " restaurant marketing photograph";										  										
  li.append(image);

  /************** Restaurant Name ***************************/
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  /************** Restaurant Neighborhood ********************/
  const neighborhood = document.createElement('p');
  neighborhood.className = 'restaurant-neighborhood';
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  /************** Restaurant Address ***************************/
  const address = document.createElement('p');
  address.className = 'restaurant-address';
  address.innerHTML = restaurant.address;
  li.append(address);

  /************** Favorite Button ***************************/
  const is_favorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const favoriteDiv = document.createElement("div");
  favoriteDiv.className = "favorite-icon";
  favoriteDiv.id = "favorite-div-" + restaurant.id;
  const favorite = document.createElement("button");
  // Identification for the Favorite Button
  favorite.id = "favorite-feature-" + restaurant.id;
  favorite.className = "favorite-icon";
  favorite.style.background = is_favorite
    ? `url("/icons/favorite.svg") no-repeat center`
    : `url("icons/notfavorite.svg") no-repeat center`;
  // Aria Labeling for the Favorite Button
  var label_attribute = document.createAttribute("aria-labelledby");
  var restaurant_name = restaurant.name;
  restaurant_name = restaurant_name.replace(/\s+/g, '');       
  label_attribute.value = restaurant_name + "favorite_label";                          
  favorite.setAttributeNode(label_attribute);                     
  favorite.innerHTML = 'Favorite Button';
  const favorite_aria_label = document.createElement('label');
  favorite_aria_label.id = restaurant_name + "favorite_label";
  favorite_aria_label.className = "aria-label";
  var temp_text = is_favorite
  ? "is a favorite"
  : "is not a favorite";
  favorite_aria_label.innerHTML = "Favorite Feature: Restaurant" + restaurant.name + temp_text + "Click to change favorite status";
  // Event Handler for the Favorite Button
  // Handle the Event
  favorite.onclick = event => handleFavoriteClick(restaurant.id, !is_favorite);
  // Add to the HTML
  favoriteDiv.append(favorite);
  li.append(favoriteDiv)
  li.append(favorite_aria_label)

  /************** Details Button ***************************/
  const more = document.createElement('button');
  var label_attribute = document.createAttribute("aria-labelledby");
  var restaurant_name = restaurant.name;
  restaurant_name = restaurant_name.replace(/\s+/g, '');       
  label_attribute.value = restaurant_name + "_label";                          
  more.setAttributeNode(label_attribute);                     
  more.innerHTML = 'View Details';

  const aria_label = document.createElement('label');
  aria_label.id = restaurant_name + "_label";
  aria_label.className = "aria-label";
  aria_label.innerHTML = "Link: Restaurant " + restaurant.name + " Details. Neighborhood: " + restaurant.neighborhood + " Address: " + restaurant.address;

  more.onclick = function() {
    const url = DBHelper.urlForRestaurant(restaurant);
    window.location = url;
  }

  li.append(more)
  li.append(aria_label)

  return li
} // end of function

// Add Map Markers
addMarkersToMap = (restaurants = self.restaurants) => {

  // For Each Restaurant, Add to Map
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  }); // end of function

} // end of function


// Handle the Favorite Feature Click
const handleFavoriteClick = (id, newState) => {

  // Update properties of the restaurant data object
  const favorite = document.getElementById("favorite-feature-" + id);
  const restaurant = self
    .restaurants
    .filter(r => r.id === id)[0];
  if (!restaurant)
    return;
  restaurant["is_favorite"] = newState;
  // Update the Event Handling to Toggle State
  favorite.onclick = event => handleFavoriteClick(restaurant.id, !restaurant["is_favorite"]);
  DBHelper.handleFavoriteClick(id, restaurant, newState);
}; // end of function
