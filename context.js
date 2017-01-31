function attachEventListenersToUsers() {
  $("[data-author] .tagline")[1].getElementsByClassName("author")[0].text
  var currentUserTagline,
      currentUsername,
      contentBox,
      userContext;

  for (var i = 0, lengthOfUsers = $("[data-author] .tagline").length; i < lengthOfUsers; i++) {
    currentUserTagline = $("[data-author] .tagline")[i];
    currentUsername = currentUserTagline.getElementsByClassName("author")[0].text;

    contentBox = document.createElement('span');
    contentBox.className = "usercontext";
    contentBox.innerHTML = "💣";

    userContext = document.createElement('span');
    userContext.className = "tooltiptext";
    userContext.innerHTML = "The following user is not as smart as he thinks he is: " + currentUsername;

    contentBox.appendChild(userContext);
    currentUserTagline.appendChild(contentBox);
  }
}

$(function() {
    console.log("Page Loaded");
    attachEventListenersToUsers();
});