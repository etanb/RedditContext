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

    getRedditUserData(currentUsername, currentUserTagline, contentBox, userContext);
  }
}

function getRedditUserData(username, currentUserTagline, contentBox, userContext) {
  var overviewData = [],
      upvotedData = [],
      savedData = [];

  $.when(
    $.get("https://www.reddit.com/user/" + username + "/overview.json?limit=10", function(overview, status){
        if(status === "success") {
          overviewData = overview.data.children;
        }
      })

    // $.get("https://www.reddit.com/user/" + username + "/upvoted.json?limit=10", function(upvoted, status){
    //     if(status === "success") {
    //       upvotedData = upvoted.data.children;
    //     }
    //   }),

    // $.get("https://www.reddit.com/user/" + username + "/saved.json?limit=10", function(saved, status){
    //     if(status === "success") {
    //       savedData = saved.data.children;
    //     }
    //   })
  ).then( function(){
    var chartArea = document.createElement("canvas");
    chartArea.width = "300";
    chartArea.height = "300";

    var chartUserData = parseUserDataForSubreddits(overviewData.concat(upvotedData, savedData));

    var subbredditChart = new Chart(chartArea, {
      type: 'pie',
      data: {
          labels: chartUserData[0],
          datasets: [
              {
                  data: chartUserData[1],
                  backgroundColor: [
                "#F9C80E",
                "#F86624",
                "#EA3546",
                "#662E9B",
                "#43BCCD",
                "#3D315B",
                "#444B6E",
                "#708B75",
                "#9AB87A",
                "#F8F991"

            ]
              }
          ]
        },
      options: { responsive: false }
    })

    userContext.appendChild(chartArea)
    contentBox.appendChild(userContext);
    currentUserTagline.appendChild(contentBox);
  })
}

function parseUserDataForSubreddits(userData) {
  var userActiveSubreddit = [],
      currentSubreddit,
      activeSubredditString = "";

  for(var i = 0, userDataLength = userData.length; i < userDataLength; i++) {
    currentSubreddit = userData[i].data.subreddit;
    
    if(!checkIfInNestedArrayAndIncrementIfTrue(userActiveSubreddit, currentSubreddit)) {
      userActiveSubreddit.push([currentSubreddit, 1]);
    }
  }

  userActiveSubreddit.sort(function(a, b){return a[1] < b[1]})
  if(userActiveSubreddit.length) {
    var userSubreddit = [],
        userCount = [];
    // userActiveSubreddit.forEach( function(item){
    //   activeSubredditString = activeSubredditString + (item[0] + ": "  + item[1].toString() + ". ")
    // })

    // return activeSubredditString;

    userActiveSubreddit.forEach( function (item) {
      userSubreddit.push(item[0]); 
      userCount.push(item[1]);
    })
    return [userSubreddit, userCount]
  } else {
    return "No Data for User";
  }
}

function checkIfInNestedArrayAndIncrementIfTrue(array, item) {
  for(var i = 0, arrayLength = array.length; i < arrayLength; i++) {
    if(array[i].indexOf(item) != -1) {
      array[i][1]++
      return true;
    }
  }
  return false;
}

$(function() {
    console.log("Page Loaded");
    attachEventListenersToUsers();
});