//=====================================================
// register.js
// Registers the service worker
// Additional Code for Debugging Help if Needed
//=====================================================

// The Browser Must Support Service Workers to Register
if (navigator.serviceWorker) {

  //console.log("👷 Starting Service Worker");

  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then(worker => {
      if (worker.installing) {
        //console.log("⚙️ Service worker installing.", worker);
        return;
      } else if (worker.waiting) {
        //console.log("⚙️ Service worker is waiting.", worker);
        return;
      } else if (worker.active) {
        //console.log("⚙️ Service worker is active.", worker);
        return;
      }
      return;
    })
    .catch(err => {
      //console.log(`⚙️ Service worker failed with ${err}.`);
    }); // end of function

} // end of if statement
