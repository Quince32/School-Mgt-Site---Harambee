const menu = document.querySelector(".menu-btn");
const nav = document.querySelector(".nav-bar");

menu.addEventListener("click", function() {
  nav.classList.toggle("open");
});