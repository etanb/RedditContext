$( document ).ready(function() {
    console.log("Page Loaded");

    // User set extension options:
    var chartDisplayStyle,
        accessibilityColors;

    function checkForUserPreferences (){
      chrome.storage.sync.get(null, function (data) { 
        chartDisplayStyle = data.chartChoice ? data.chartChoice : "doughnut"
        accessibilityColors = data.accessibleChoice ? JSON.parse(data.accessibleChoice) : false
      });

      attachEventListenersToUsers();
    };

    function attachEventListenersToUsers() {
      $("[data-author] .tagline").each( function(index, currentUserTagline){
        var currentUsername = currentUserTagline.getElementsByClassName("author")[0];

        if(currentUsername && currentUsername.text) {
          var userNeedsData = (function() {
            var wasDataLoaded = true;
            
            return {
              dataLoadedBoolean: function() {
                return wasDataLoaded
              },
              dataLoadedTrue: function() {
                wasDataLoaded = false;
              }
            }
          }())

          var contentBox = document.createElement('span');
          contentBox.className = "usercontext";
          contentBox.innerHTML = "💣";

          currentUserTagline.appendChild(contentBox);

          var userContext = document.createElement('span');
          userContext.className = "tooltiptext";

          $(contentBox).mouseenter(function(){
            if(userNeedsData.dataLoadedBoolean()) {
              getRedditUserData(currentUsername.text, currentUserTagline, contentBox, userContext, userNeedsData);
            }
          })
        };
      })
    }

    function getRedditUserData(username, currentUserTagline, contentBox, userContext, userNeedsData) {
      var overviewData = [],
          upvotedData = [],
          savedData = [];

      $.when(
        $.get("https://www.reddit.com/user/" + username + "/overview.json?limit=10", function(overview, status){
            if(status === "success") {
              overviewData = overview.data.children;
            }
          })
      ).then( function(){
        var chartArea = document.createElement("canvas");
        // make sure userNeedsData is set to true so the information isn't loaded again on hover
        userNeedsData.dataLoadedTrue()

        chartArea.width = "300";
        chartArea.height = "300";

        var chartUserData = parseUserDataForSubreddits(overviewData.concat(upvotedData, savedData));

        var subbredditChart = new Chart(chartArea, {
          type: chartDisplayStyle,
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

    checkForUserPreferences();
});