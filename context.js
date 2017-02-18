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
        // make sure userNeedsData is set to true so the information isn't loaded again on hover
        userNeedsData.dataLoadedTrue()

        if (chartDisplayStyle != "cloud") {
          var chartArea = document.createElement("canvas"),
              chartUserData = parseUserDataForSubreddits(overviewData.concat(upvotedData, savedData), false),
              chartData,
              subbredditChart;

          chartArea.width = "300";
          chartArea.height = "300";

          

          if (chartDisplayStyle === "bar") {
            chartData = {
                labels: chartUserData[0],
                datasets: [
                    {
                        label: "Subreddit Activity for: " + username,
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

                  ],
                      borderWidth: 2
                    }
                ]
              }

              subbredditChart = new Chart(chartArea, {
                type: chartDisplayStyle,
                data: chartData,
                options: { 
                  responsive: false,
                  scales: {
                          yAxes: [{
                              display: true,
                              ticks: {
                                  beginAtZero: true,
                                  stepSize: 1
                              }
                          }]
                      }
                }
              })
            } else {
              chartData = {
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
                }

                subbredditChart = new Chart(chartArea, {
                  type: chartDisplayStyle,
                  data: chartData,
                  options: { 
                    responsive: false
                  }
                })
            }

        } else {
          var chartArea = document.createElement("div"),
              chartUserData = parseUserDataForSubreddits(overviewData.concat(upvotedData, savedData), true)

          $(chartArea).jQCloud(chartUserData, {
            width: 400,
            height: 300
          });
        } 

        var redditActivityScore = checkForRedditUsage(overviewData.concat(upvotedData, savedData)),
            activityArea = document.createElement("span");

        switch(true) {
          case (redditActivityScore > 2.5):
            activityArea.innerHTML = "This user is a heavily active Reddit user.";
            activityArea.className = "heavily-active";
            break;
          case (redditActivityScore > 1.5):
            activityArea.innerHTML = "This user is a frequently active Reddit user.";
            activityArea.className = "frequent-active ";
            break;
          case (redditActivityScore > 1):
            activityArea.innerHTML = "This user is an infrequently active Reddit user.";
            activityArea.className = "infrequent-active ";
            break;
          default:
            activityArea.innerHTML = "This user is rarely active on Reddit.";
            activityArea.className = "rare-active";
            break;
        }
        
        userContext.appendChild(chartArea)
        userContext.appendChild(activityArea);
        contentBox.appendChild(userContext);
        

        currentUserTagline.appendChild(contentBox);
      })
    }

    function checkForRedditUsage(userData) {
      var redditFrequencyScore = 0;

      userData.forEach( function(item) {
        var itemCreationUTC = item.data.created_utc,
            newDateObj = new Date(0),
            timeDifference;

        newDateObj.setUTCSeconds(itemCreationUTC);

        timeDifference = (new Date - newDateObj) / 1000 / 60 / 60;

        switch(true) {
          case (timeDifference < 24): // within one day
            redditFrequencyScore += 3;
            break;
          case (timeDifference < 48): // within two days
            redditFrequencyScore += 2.5;
            break;
          case (timeDifference < 72): // within three days
            redditFrequencyScore += 2.25;
            break;
          case (timeDifference < 168): // within one week
            redditFrequencyScore += 1.5;
            break;
          case (timeDifference < 336): // within two weeks
            redditFrequencyScore += 1.25;
            break;
          case (timeDifference < 504): // within three weeks
            redditFrequencyScore += 1.125;
            break;
          default: 
            redditFrequencyScore += 1;
        }

      })
      
      return redditFrequencyScore / userData.length;
    }

    function parseUserDataForSubreddits(userData, forWordCloud) {
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
      if (forWordCloud && userActiveSubreddit.length) {
        var userWordCloud = [];

        userActiveSubreddit.forEach( function (item) {
          userWordCloud.push({
            text: item[0],
            weight: item[1]
          })
        })

        return userWordCloud;
      } else if (userActiveSubreddit.length) {
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