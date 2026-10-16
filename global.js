// Print a message to confirm this file loaded.
console.log('IT’S ALIVE!');

// Find matching HTML elements and return them as an array.
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// List each link's destination (url) and visible text (title).
let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "https://github.com/owtran", title: "GitHub" },
];

// Create an empty navigation menu.
let nav = document.createElement("nav");

// Put the menu at the beginning of the page's body.
document.body.prepend(nav);

// Use "/" locally or the repository path on GitHub Pages.
const BASE_PATH =
  (location.hostname === "localhost" ||
   location.hostname === "127.0.0.1")
    ? "/"
    : "/dsc106_lab1_beta_test_portfolio/";

// Repeat these steps for each page in the list.
for (let p of pages) {
  let url = p.url; // Get this page's destination.
  let title = p.title; // Get this page's link text.

  // Add the base path if the link does not start with "http".
  if (!url.startsWith("http")) {
    url = BASE_PATH + url;
  }

  let a = document.createElement("a"); // Create a link.
  a.href = url; // Set where the link goes.
  a.textContent = title; // Set the text shown on the link.

  // Highlight the link if its host and path match this page.
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add("current");
  }

  // Open links to a different host in a new tab.
  if (a.host !== location.host) {
    a.target = "_blank"; // Open a new tab.
    a.rel = "noopener noreferrer"; // Block opener access and referrer info.
  }

  nav.append(a); // Add this link to the end of the menu.
}




// Add light/dark theme dropdown to every page: 
// Add the theme dropdown to every page.
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);



// setProperty -> changes css color scheme 

// Selects the theme dropdown we just made 
let select = document.querySelector(".color-scheme select");

// Restores the saved theme when the page loads.
if ("colorScheme" in localStorage) {
  let savedTheme = localStorage.colorScheme;

  document.documentElement.style.setProperty("color-scheme", savedTheme);
  select.value = savedTheme;
}

// Actually changes the theme when selects the option and saves it! 
select.addEventListener("input", (event) => {
  let theme = event.target.value;

  document.documentElement.style.setProperty("color-scheme", theme);
  localStorage.colorScheme = theme;
});

// localStorage remembers your choice in the browser
// select.value makes dropdown display that saved choice aswell 






// Find the contact form.
let form = document.querySelector("form");

form?.addEventListener("submit", (event) => {
  event.preventDefault(); // Stop normal submission.


  let data = new FormData(form); // Collect the fields.
  let parameters = [];

  // Encode each field and add it to the list.
  for (let [name, value] of data) {
    parameters.push(
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
    );
  }

  // Join the fields with & to build the email URL.
  let url = form.action + "?" + parameters.join("&");

  location.href = url; // Open the email draft.
});