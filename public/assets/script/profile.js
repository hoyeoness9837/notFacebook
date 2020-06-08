const logOut = () => {
  console.log("hello");
  var date = new Date();

  var utcDate = new Date(date.toUTCString());
  utcDate.setHours(utcDate.getHours());
  var usDate = new Date(utcDate);
  document.cookie = `name=''; expires = ${usDate.toUTCString()}`;
  // axios.get('/')
  // .then(()=>{})
  // .catch(err => console.error(err))
  setTimeout(() => {
    window.location.replace("/");
  }, 1000);
};

function loggedInStatus() {
  if (!document.cookie.split("=")[1]) {
  } else {
    axios
      .get(`/api/users/info/${document.cookie.split("=")[1]}`)
      .then(({ data }) => {
        $(".main").empty();
        userPost(
          data.UserPost,
          data.UserInfo.FirstName,
          data.UserInfo.LastName,
          ""
        );
        generateRecentPost();
        document.getElementById("loggedIn").innerHTML = `
              Logged in as ${data.UserInfo.FirstName} ${data.UserInfo.LastName}
              <button id='logOut' onclick='logOut()'>Log Out</button>
              `;
      })
      .catch((err) => console.log(err));
  }
}

function userPost(userPost, firstName, lastName, type) {
  if (userPost.length === 0 && (type === "friend" || type === "friendWall")) {
    $(".main").append(`<h1 class="noPost">This user has no post</h1>`);
  }
  if (userPost.length === 0 && type === "") {
    $(".main").append(
      `<h1 class="noPost yourposttext">Do you want to post your first post?</h1>`
    );
  }
  userPost.forEach((post) => {
    // console.log("In userpost")
    // console.log(post)
    let comments = post.comments.reduce((allComments, comments) => {
      return (allComments += `<p>${comments.username} : ${comments.title} <span class="times">( On ${comments.time} )</span></p>`);

      // console.log(comments)
    }, "");

    let button;
    if (type === "friend") {
      button = "";
    } else if (type === "friendWall") {
      button = "";
    } else {
      // $('.backHome').remove()
      button = `<button class="deletePost" name = "delete" onclick=deletePost(${post.id})>Delete | x</button>`;
    }
    let image = "";
    if (post.image !== "#") {
      image = `<img src="${post.image}" alt="" class="postImage"></img>`;
    }
    $(".main").prepend(
      `     
            <div class="myPost" data-id="${post.id}">
            ${button}
            <h3 class ="username"> ${firstName} ${lastName} : <span class ="postbody">${post.body}</span></h3>
            
            <div class="image"> 
            ${image}
               </div>
            <div class="commentArea comment${post.id}">
            ${comments}
            </div>
            <form  method="POST" data-postId="${post.id}" name="comment" class="commentForm">
              <input type="text" name="text" placeholder="Add your comment" />
              <input type="submit"  name="Send" value="Send" />
            </form>
          </div>`
    );
    $(`.comment${post.id}`).animate(
      { scrollTop: $(`.comment${post.id}`).height() * 10000 },
      1000
    );
  });

  if (type === "friend") {
    $(".main").prepend(
      `<button class="backHome"  onclick=back()>HOME</button>`
    );
  }
}

// Tim 06/08
function back() {
  if (!document.cookie.split("=")[1]) {
  } else {
    axios
      .get(`/api/users/info/${document.cookie.split("=")[1]}`)
      .then(({ data }) => {
        $(".main").empty();
        userPost(
          data.UserPost,
          data.UserInfo.FirstName,
          data.UserInfo.LastName,
          ""
        );
        document.getElementById("loggedIn").innerHTML = `
              Logged in as ${data.UserInfo.FirstName} ${data.UserInfo.LastName}
              <button id='logOut' onclick='logOut()'>Log Out</button>
              `;
      })
      .catch((err) => console.log(err));
  }
}

// Tim recent friend post
function generateRecentPost() {
  $(".postlist").empty();
  axios
    .get(`api/posts/friendrecentposts/${document.cookie.split("=")[1]}`)
    .then(({ data }) => {
      data.forEach((item) => {
        $(".postlist").prepend(
          `  <div class="userpost" data-postid='${item.id}'>
                        <button onclick=showPost('${item.id}','${
            item.user.firstName
          }','${item.user.lastName}')>
                        <p>User:${item.user.firstName}<p>
                        <p> ${item.body.slice(0, 40)}... </p>
                        <p>${item.time} <p>
                       </button>
                      </div>`
        );
      });
    })
    .catch((err) => console.error(err));
}
// Show post
function showPost(data, fname, lname) {
  // console.log(fname)
  axios
    .get(`api/posts/getpost/${data}`)
    .then(({ data }) => {
      $(".main").empty();
      userPost([data], fname, lname, "friend");
    })
    .catch((err) => console.error(err));
}

// Add new post
let recent = false;
document.getElementById("post").addEventListener("click", async (event) => {
  event.preventDefault();
  let now =
    (await new Date().toLocaleDateString()) +
    " " +
    new Date().toLocaleTimeString();
  $(".time").val(`${now}`);
  let formData = new FormData(document.getElementById("POSTIT"));

  if (
    document.getElementById("file").value.length > 0 ||
    document.getElementById("posttext").value !== ""
  ) {
    axios
      .post("api/posts/addpost", formData)
      .then(({ data }) => {
        if (!recent) {
          $(".main").scrollTop(0);
          $(".backHome").remove();
          let check = document.querySelectorAll(".main .myPost");
          if (check.length === 0) {
            $(".main").empty();
          }

          let found = false;
          check.forEach((item) => {
            if (item.name !== "delete") {
              if (item.children[0].name !== "delete") {
                item.remove();
                found = true;
              }
            }
          });

          if (found) {
            back();
          } else {
            userPost([data[0].data], data[1].firstName, data[1].lastName, "");
          }
          socket.emit("Update", [
            "newpost",
            `${document.cookie.split("=")[1]}`,
          ]);
        } else {
          loggedInStatus();
        }
      })
      .catch((err) => console.error(err));

    document.getElementById("file").value = null;
    document.getElementById("posttext").value = "";
  }

  document.getElementById("posttext").focus();
});

// Add friend on click

// //show a list of other users who are not friends yet with me - hoyeon(6/7/20-11pm)
const renderFriendSuggestion = () => {
  if (!document.cookie.split("=")[1]) {
    console.log("Not logged in");
  } else {
    axios
      .get(`/api/friend/findfriend/${document.cookie.split("=")[1]}`)
      .then(({ data }) => {
        document.getElementById("friendSuggest").innerHTML = "";
        for (let i = 0; i < data.length; i++) {
          let notfriendElem = document.createElement("div");
          notfriendElem.innerHTML = `<div class="friendbox" data-friendbtn='${data[i].uuid}'><button> ${data[i].firstName} ${data[i].lastName}</button><button id='add' onclick=addFriend('${data[i].uuid}')><span>➕</span></button></div>`;
          document.getElementById("friendSuggest").append(notfriendElem);
        }
      })
      .catch((err) => console.log(err));
  }
  renderMyFriends();
};

// let addFriend = document.querySelector('#myfriend')
// function addFriend( id ) {
//   if (event.target.id === "add") {
//     axios
//       .post("api/friend/addfriend", {
//         userUuid: document.cookie.split("=")[1],
//         friendUuid: id,
//       })
//       .then(() => {
//         renderFriendSuggestion();
//         renderMyFriends();
//       })
//       .catch((err) => console.error(err));
//   }
// }

function addFriend(id) {
  axios
    .post("api/friend/addfriend", {
      userUuid: document.cookie.split("=")[1],
      friendUuid: id,
    })
    .then(() => {
      renderFriendSuggestion();
      renderMyFriends();
      generateRecentPost();
      socket.emit("Update", ["addfriend", `${id}`]);
      document.getElementById("friends").innerHTML = `
      <section class="myFriends">
        <div>My current friends</div>
        <div class="user" data-uid="" id="friendList">
          <!-- <button>User 1</button> -->
        </div>
      </section>
      <!-- add friend button -->
      <section class="addFriends">
        <div>Add new friends</div>
        <div class="user"  id="friendSuggest">
          <!-- <button>+ hoyeon</button> -->
        </div>
      </section>
      `;
    })
    .catch((err) => console.error(err));
}

//search and first name of users - alan - hoyeon(6/7/20-11pm)
// $("#searchFriendForm").submit((e) => {
//   e.preventDefault();
//   let friend = document.getElementById("searchFriend").value;
//   if (friend !== "") {
//     axios
//       .post("/api/searchFriend", { firstName: friend })
//       .then(({ data }) => {
//         document.getElementById("friendSuggest").innerHTML = data.reduce(
//           (acc, friend) => {
//             acc += `<div class="friendbox"><button style="border:1px solid red"><div> ${friend.firstName} ${friend.lastName}</button><button id='add' onclick=addFriend('${friend.uuid}')><span>➕</span></button></div>`;
//             return acc;
//           },
//           ""
//         );
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }
// });

// search and first name of users - alan - hoyeon(6/7/20-11pm) - Tim edited from
document
  .getElementById("searchFriendForm")
  .addEventListener("keyup", (event) => {
    // console.log(event.key);
    let time;
    clearInterval(time);
    time = setTimeout(() => {
      if (!/\S/.test(document.getElementById("searchFriend").value)) {
        // console.log("rerender");
        renderFriendSuggestion();
      } else {
        axios
          .post("/api/searchFriend", {
            userUuid:document.cookie.split("=")[1],
            firstName: document.getElementById("searchFriend").value,
          })
          .then(({ data }) => {
            document.getElementById("friendSuggest").innerHTML = data.reduce(
              (acc, friend) => {
                acc += `<div class="friendbox"><button style="border:1px solid red"><div> ${friend.firstName} ${friend.lastName}</button><button id='add' onclick=addFriend('${friend.uuid}')><span>➕</span></button></div>`;
                return acc;
              },
              ""
            );
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }, 1000);
  });

//delete a friend from myfriendList - hoyeon
function unFriend(id) {
  axios
    .delete("api/friend/unfriend", {
      data: {
        userUuid: document.cookie.split("=")[1],
        friendUuid: id,
      },
    })
    .then(() => {
      renderMyFriends();
      renderFriendSuggestion();
      generateRecentPost();
      socket.emit("Update", ["unfriend", `${id}`]);
    })
    .catch((err) => console.error(err));
}

//show all users who are currently friends with me- hoyeon
const renderMyFriends = () => {
  axios
    .get(`/api/users/info/${document.cookie.split("=")[1]}`)
    .then(({ data }) => {
      let friendData = data.UserFriends;
      document.getElementById("friendList").innerHTML = "";
      for (let i = 0; i < friendData.length; i++) {
        let friendElem = document.createElement("div");
        friendElem.innerHTML = `<div class="friendbox" data-friendbtn="${friendData[i].Id}"><button class='myfriend' onclick=friendWall('${friendData[i].Id}')> ${friendData[i].firstName} ${friendData[i].lastName}</button><button id='unFriend' onclick=unFriend('${friendData[i].Id}')><span>🗑️</span></button></div>`;
        document.getElementById("friendList").append(friendElem);
      }
    })
    .catch((err) => console.log(err));
};

// Tim 6/8/20
let friendWall = (id) => {
  $(".main").empty();
  axios
    .get(`/api/users/info/${id}`)
    .then(({ data }) => {
      userPost(
        data.UserPost,
        data.UserInfo.FirstName,
        data.UserInfo.LastName,
        "friendWall"
      );
      $(".main").prepend(
        `<button class="backHome"  onclick=back()>HOME</button>`
      );
    })
    .catch((err) => console.log(err));
};

// Generate comment
function generateComment(commId, user, value, time) {
  $(`${commId}`).append(
    `<p>${user}: ${value} <span class="times">( On ${time} )</span></p>`
  );
}

// Add comment
document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (
    (event.target.name === "comment" && event.target.text.value.length > 0) ||
    event.target.text.value.replace(/\s/g, "").length > 0
  ) {
    if (document.cookie.split("=")[1]) {
      axios
        .get(`/api/users/info/${document.cookie.split("=")[1]}`)
        .then(({ data }) => {
          // (new Date().toLocaleTimeString()); // 11:18:48 AM
          //---
          // (new Date().toLocaleDateString()); // 11/16/2015

          let now =
            new Date().toLocaleDateString() +
            " " +
            new Date().toLocaleTimeString();
          let body = {
            username: data.UserInfo.FirstName + " " + data.UserInfo.LastName[0],
            title: event.target.text.value,
            postId: event.target.dataset.postid,
            time: now,
          };
          axios
            .post("api/comments", body)
            .then((message) => {
              socket.emit("Update", [
                "comment",
                `.comment${event.target.dataset.postid}`,
                `<p>${message.data.username} : ${message.data.title} <span class="times">( On ${message.data.time} )</span></p>`,
              ]);
              event.target.text.value = "";
              // $(`.comment${event.target.dataset.postid}`).scrollTop(1E10)
            })
            .catch((err) => console.error(err));
        })
        .catch((err) => console.error(err));
    }
  }
});

// Delete post - Tim
function deletePost(id) {
  event.preventDefault();
  // console.log(event.target.name)
  if (event.target.name === "delete") {
    axios
      .delete(`api/posts/delete/${document.cookie.split("=")[1]}/${id}`)
      .then((data) => {
        console.log(data);
        let post = document.querySelectorAll(".myPost");
        post.forEach((item) => {
          if (item.dataset.id === `${id}`) {
            item.classList.add("delete");
            item.style.height = "50px";
            item.innerHTML = "";
            setTimeout(() => {
              item.remove();
              let check = document.querySelectorAll(".main .myPost");
              if (check.length === 0) {
                userPost([], "", "", "");
              }
            }, 1500);
          }
        });

        socket.emit("Update", ["deletepost", `.userpost`, `${id}`]);
      })
      .catch((err) => console.error(err));
  }
}

// Pravin -
document.getElementById("dropdown").addEventListener("click", (event) => {
  event.preventDefault();
  console.log(event.target.value);
  if (event.target.value === "home") {
    $(".main").empty();
    loggedInStatus();
    $(".postarea").show();
    $(".main").scrollTop(0);
  }

  if (event.target.value === "recentpost") {
    recentPostsMobile();
    $(".main").scrollTop(0);
  }

  if (event.target.value === "friends") {
    $(".postarea").hide();
    axios
      .get(`/api/users/info/${document.cookie.split("=")[1]}`)
      .then(({ data }) => {
        let friendData = data.UserFriends;
        $(".main").empty();
        $(".main").innerHTML = "";
        for (let i = 0; i < friendData.length; i++) {
          let friendElem = document.createElement("div");

          friendElem.innerHTML = `<div class="friendbox" data-friendbtn='${friendData[i].Id}'><button class='myfriendmobileview'> ${friendData[i].firstName} ${friendData[i].lastName}</button><button id='unFriend' onclick=unFriend('${friendData[i].Id}')><span>🗑️</span></button></div>`;
          $(".main").append(friendElem);
        }
      })
      .catch((err) => console.log(err));
    // $('.main').scrollTop(0)
  }

  if (event.target.value === "logout") {
    logOut();
  }
});

// function

function recentPostsMobile() {
  axios
    .get(`api/posts/friendrecentposts/${document.cookie.split("=")[1]}`)
    .then(({ data }) => {
      // console.log(data)
      $(".main").empty();
      $(".main").prepend(
        data.reduce((acc, posts) => {
          console.log(posts);
          acc += `  <div class="" data-postid='${posts.id}'>
                  <button onclick=showPost('${posts.id}','${
            posts.user.firstName
          }','${posts.user.lastName}')>
                  <p>User:${posts.user.firstName}<p>
                  <p> ${posts.body.slice(0, 20)}... </p>
                  <p>At: ${posts.time} <p>
                 </button>
                </div>`;
          return acc;
        }, "")
      );
    });
}

let sessionSet = async (data) => {
  var date = await new Date();
  var utcDate = await new Date(date.toUTCString());
  utcDate.setHours(utcDate.getHours() + 1);
  var usDate = await new Date(utcDate);
  document.cookie = await `name=${data}; expires = ${usDate.toUTCString()}`;
  if (!data) {
    window.location.replace("/");
  }
};

window.addEventListener("focus", (event) => {
  sessionSet(document.cookie.split("=")[1]);
});

//                 // data.forEach(item => {
//                 //     console.log(item)
//                 //     $(".postlist").prepend(
//                 //         `  <div class="userpost" data-postid='${item.id}'>
//                 //         <button onclick=showPost('${item.id}','${item.user.firstName}','${item.user.lastName}')>
//                 //         <p>User:${item.user.firstName}<p>
//                 //         <p> ${item.body.slice(0,20)}... </p>
//                 //         <p>At: ${item.createdAt.split(/[a-zA-Z.]/)[1]} <p>
//                 //        </button>
//                 //       </div>`
//                 //     )
//                 // });

//             }
//         )
//         .catch(err => console.error(err))
//   }

// const logOut = () => {
//   console.log("hello");
//   var date = new Date();
//   var utcDate = new Date(date.toUTCString());
//   utcDate.setHours(utcDate.getHours());
//   var usDate = new Date(utcDate);
//   document.cookie = `name=''; expires = ${usDate.toUTCString()}`;
//   window.location.replace("/");
// };

// //show all users who are currently friends with me- hoyeon
// const renderMyFriends = () => {
//   axios
//     .get(`/api/users/info/${document.cookie.split("=")[1]}`)
//     .then(({ data }) => {
//       let friendData = data.UserFriends;
//       console.log(friendData);
//       document.getElementById("friendList").innerHTML = "";
//       for (let i = 0; i < friendData.length; i++) {
//         let friendElem = document.createElement("div");
//         friendElem.innerHTML = `<button id='myfriend'> ${friendData[i].firstName} ${friendData[i].lastName}</button>`;
//         document.getElementById("friendList").append(friendElem);
//       }
//     })
//     .catch((err) => console.log(err));
// };

// document.addEventListener("click", (event) => {
//   event.preventDefault();
//   if (event.target.id === "add") {
//     axios
//       .post("api/friend/addfriend", {
//         userUuid: document.cookie.split("=")[1],
//         friendUuid: event.target.dataset.item,
//       })
//       .then(() => {
//         renderFriendSuggestion();
//         renderMyFriends();
//       })
//       .catch((err) => console.error(err));
//   }
// });

// //show a list of other users who are not friends yet with me - hoyeon
// const renderFriendSuggestion = () => {
//   if (!document.cookie.split("=")[1]) {
//     console.log("Nothing");
//   } else {
//     console.log("connected");
//     axios
//       .get(`/api/friend/findfriend/${document.cookie.split("=")[1]}`)
//       .then(({ data }) => {
//         document.getElementById("friendSuggest").innerHTML = "";
//         for (let i = 0; i < data.length; i++) {
//           console.log(data[i]);
//           let notfriendElem = document.createElement("div");
//           notfriendElem.innerHTML = `<button id='add' data-item="${data[i].uuid}" > + ${data[i].firstName} ${data[i].lastName}</button>`;
//           document.getElementById("friendSuggest").append(notfriendElem);
//         }
//       })
//       .catch((err) => console.log(err));
//   }
//   renderMyFriends();
// };

// const loggedInStatus = () => {
//   if (!document.cookie.split("=")[1]) {
//     console.log("Nothing");
//   } else {
//     console.log("Something");
//     axios
//       .get(`/api/users/info/${document.cookie.split("=")[1]}`)
//       .then(({ data }) => {
//         console.log(data);
//         //Suggestion(hoyeon): how about using an username instaed of first & lastname?
//         document.getElementById("loggedIn").innerHTML = `
//               Logged in as ${data.FirstName} ${data.LastName}
//               <button id='logOut' onclick='logOut()'>Log Out</button>
//               `;
//               generateRecentPost()
//       })
//       .catch((err) => console.log(err));
//   }
// };

// // Generate recent post
//   function generateRecentPost()
//   {
//       console.log(`${document.cookie.split("=")[1]}`)
//         axios.get(`api/posts/friendrecentposts/${document.cookie.split("=")[1]}`)
//         .then( ({data}) =>
//             {
//                 console.log(data)
//                 data.forEach(item => {
//                     // console.log(item)
//                     $(".postlist").prepend(
//                         `  <div class="userpost" data-postid='${item.id}'>
//                         <button>
//                         <p>User:${item.user.firstName}<p>
//                         <p> ${item.body.slice(0,20)}... </p>
//                         <p>At: ${item.createdAt.split(/[a-zA-Z.]/)[1]} <p>
//                        </button>
//                       </div>`
//                     )
//                 });

//             }
//         )
//         .catch(err => console.error(err))
//   }

//   // Submit new post
//   document.getElementById('post').addEventListener('click', event =>
// {
//   event.preventDefault()
//   let formData = new FormData(document.getElementById('POSTIT'))
//   // formData.append('files', )
//   axios.post('api/posts/addpost', formData)
//   .then(({ data }) => userPost([data[0].data],data[1].firstName,data[1].lastName))
//   .catch(err => console.error(err))
// })

// // User post
// function userPost(userPost,firstName,lastName)
// {
//   console.log(userPost)
//     userPost.forEach(post => {
//         // console.log("In userpost")
//         // console.log(post)
//         let comments = post.comments.reduce((allComments, comments) =>
//         {
//             return allComments +=
//            ` <p>Name: <span>${comments.title}</span></p>`

//             // console.log(comments)
//         }
//         ,'')

//         $('.main').prepend(
//             `
//             <div class="myPost">
//             <p>${firstName} ${lastName}</p>
//             <p>${post.body}</p>
//             <div class="image">
//             <img src="${post.image}" alt="" class="postImage">
//                </div>
//             <hr />
//             <div class="commentArea">
//             ${comments}
//             </div>
//             <form  method="POST" data-postId="${post.id}"class="commentForm">
//               <input type="text" placeholder="Add your comment" />
//               <input type="submit" name="Send" value="Send" />
//             </form>
//           </div>`)
//             })
// }

function init() {
  loggedInStatus();
  renderFriendSuggestion();
}

init();
