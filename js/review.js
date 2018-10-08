//=====================================================
// Review.js
// Primarily handles processings of Add Review Feature
//=====================================================

// IDB References
const IDB_NAME = "udacity-restaurant";
const RESTAURANTS = "restaurants";
const REVIEWS = "reviews";
const UNRESOLVED = "pending";

// IDB Promise
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
      upgradeDB.createObjectStore("pending", {
        keyPath: "id",
        autoIncrement: true
      });
  }
});

// Event Listner to Process Pending Reviews
// Prints Notification of Offline Requests
window.addEventListener("load", event => {

  // If the User is Offline
  if (!navigator.onLine) {
    
    // Add Event Listener For Return to Online Status
    window.addEventListener('online', event => {
      
      // Process the Pending Reviews
      DBHelper.processPendingDB();

      // Update the Page For Offline and Pending Review Status
      const main = document.getElementById("maincontent");
      const notification = document.createElement("section");
      notification.setAttribute("class", "pending");
      const message = document.createElement("p");
      message.innerHTML = `Processed pending offline review requests.`;
      notification.appendChild(message);
      main.appendChild(notification);
    }); // end of event listener addition
  } // end of offline conditional
  else
  {
    // Process any pending requests
    DBHelper.processPendingDB();        
  } // end of else statement
  
  // Pending Requests in IndexDB Notification
  DBHelper.getPendingDB().then(pending => {
    // Print Pending Requests if Existing
    if (pending.length > 0) {
      // Update HTML Review Container and Print Notification to User
      const main = document.getElementById("maincontent");
      const notification = document.createElement("section");
      notification.setAttribute("class", "pending");
      const message = document.createElement("p");
      message.innerHTML = `Offline: ${pending.length} pending requests.`;
      notification.appendChild(message);
      main.appendChild(notification);
    } // end of iff statement
  }); // end of promise handling
}); // end of function

// Handle the Add Review Form Submit Button 
const handleFormSubmit = e => {
  e.preventDefault();

  // Get Form Elements
  const name = document.getElementById("name");
  const rating = document.getElementById("rating");
  const comments = document.getElementById("comment");
  
  // Restaurant ID
  const restaurant_id = Number(document.getElementById("restaurant-id").innerHTML);
 
  // Clear Previous Form Errors
  const errors = document.getElementById("errors");
  if (errors) {
    errors.remove();
    name.removeAttribute("class");
    comments.removeAttribute("class");
  }

  // Assemble Review Object
  const review = {
    id: Date.now(),
    restaurant_id: restaurant_id,
    name: name.value,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    rating: rating.value,
    comments: comments.value
  };

  // Validate the form
  const isValid = validateForm();

  // If the form is valid post the review
  if (isValid) {
           
      DBHelper.addReview(review, (err, review) => {
        if (err && !review) {
          // Everything failed.
          return;
        }

        // Clear the Form
        document.getElementById("add-review").reset();

        // Hide the Review Container
        document.getElementById('reviews-add-container').style.display == `none`;

        // Refresh the Reviews and Page
        refreshPage(restaurant_id);
      }); // end of addReview processing

  } // end of processing a valid review
}; // end of handle submit button function

// Refreshes the current page with the Restaurant ID
const refreshPage = (restaurant_id) => {
  const path = `restaurant.html?id=${restaurant_id}`;
  window.location.href = `/${path}`;
} // end of refreshPage function

// Validate the Add Review Form
const validateForm = () => {
  // Errors will be an array of mistakes to correct.
  let errors = [];
  let name = document.getElementById("name").value;
  let comments = document.getElementById("comment").value;

  // name min:1, max: 25, must be alpha, no numbers.
  // updates the html with the error validation issue
  if (!((name.length > 0) && (name.length < 26))) {
    errors.push(
      `Name must be between 1 and 25 characters. You entered ${name.length}`
    );
    name = document.getElementById("name");
    name.setAttribute("class", "form-input-fail");
  }
  // comments. min: 1, max: 140;
  // updates the html with the error validation issue
  if (!((comments.length > 0) && (comments.length < 141))) {
    errors.push(
      `Your comment must be between 1 and 140 characters. You have ${
        comments.length
      } characters.`
    );
    comments = document.getElementById("comment");
    comments.setAttribute("class", "form-input-fail");
  }
  // Prompt the user to correct errors.
  // Updates the html with the list of errors
  if (errors.length > 0) {
    const container = document.getElementById("reviews-add-container");
    const list = document.createElement("ul");
    list.setAttribute("id", "errors");
    container.appendChild(list);

    // Add the errors.
    errors.map(error => {
      const li = document.createElement("li");
      li.innerHTML = error;
      list.appendChild(li);
    });
    return false;
  }
  return true;
}; // end of function