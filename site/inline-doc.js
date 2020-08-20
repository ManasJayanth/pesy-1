const Diff = require("diff");
const { createStore } = require("redux");

let repo = "esy/pesy";
let url = "https://api.github.com/repos/" + repo + "/readme";

let initialState = {
  selectTools: { open: false },
  editForm: { open: false },
};

function toolActions(state = { open: false }, action) {
  switch (action.type) {
    case "OPEN":
      return { open: true };
    case "CLOSE":
      return { open: false };
    case "TOGGLE":
      return { open: !state.open };
    default:
      return state;
  }
}

let actions = (state, action) => {
  return {
    selectTools: toolActions(state, action),
    editForm: toolActions(state, action),
  };
};

let previousState = initialState;
function render(store) {
  let now = store.getState();
  let { selectTools: selectToolsNow, editForm: editFormNow } = now;

  let {
    selectTools: selectToolsBefore,
    editForm: editFormBefore,
  } = previousState;

  // render logic
  if (selectToolsNow.open != selectToolsBefore.open) {
  }

  previousState = now;
}

let store = createStore(actions);
function createSelectToolsHolder(document) {}

let selectToolsHolder = createSelectToolsHolder(document);
store.subscribe(() => render(store, selectToolsHolder));

let selectionEl;
document.addEventListener("selectionchange", (e) => {
  // console.log(document.getSelection().toString());
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);

  if (range.collapsed) {
    return;
  }

  let selectedStr = selection.toString();

  if (!selectionEl) {
    selectionEl = document.createElement("div");
    selectionEl.innerHTML =
      '<div id="suggest-edit"><button style="border: none; border-radius: 4px; cursor: pointer; padding: 1rem; font-size: 1rem; font-family: inherit; ">Suggest edit</button></div>';
    selectionEl.style.position = "absolute";

    document.body.appendChild(selectionEl);
    document
      .querySelector("#suggest-edit button")
      .addEventListener("click", function () {
        document.getElementById("suggest-edit").innerHTML =
          '<form id="edit-form"><textarea>' +
          selectedStr +
          '</textarea><button type="submit">submit</button></form>';
        let editFormTextArea = document.querySelector("#edit-form textarea");
        editFormTextArea.addEventListener("click", function (e) {
          e.stopPropagation();
        });
        document
          .getElementById("edit-form")
          .addEventListener("submit", function (e) {
            e.preventDefault();
            let editStr = editFormTextArea.value;
            $.get(url, {})
              .fail(function (e) {
                console.log(e, null);
              })
              .done(function (data) {
                var markdown = atob(data.content);
                let newMarkdown = markdown.replace(selectedStr, editStr);
                console.log(Diff);
                let diff = Diff.createTwoFilesPatch(
                  "Readme.html",
                  "Readme.html",
                  markdown,
                  newMarkdown,
                  ""
                );
                window.open(
                  "https://github.com/esy/pesy/issues/new?title=Documentation:&body=" +
                    encodeURIComponent(diff)
                );
              });
          });
      });
  }

  var selectionRect = range.getBoundingClientRect();
  var rootRect = document.body.parentNode.getBoundingClientRect();
  selectionEl.style.top = selectionRect.bottom - rootRect.top + "px"; //this will place ele below the selection
  selectionEl.style.right = -(selectionRect.right - rootRect.right) + "px"; //this will align the right edges together
});
