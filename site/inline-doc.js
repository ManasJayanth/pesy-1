const Diff = require("diff");
const { combineReducers, createStore } = require("redux");

let repo = "esy/pesy";
let url = "https://api.github.com/repos/" + repo + "/readme";

let initialState = {
  selectTools: { tool: null }, // { type: SuggestEdit | EditForm, top, right, selectedStr  }
};

let actions = {
  selectTools: {
    open: function (selectedStr, type, top, right) {
      return {
        type: "SELECT_TOOLS_OPEN",
        data: { type, top, right, selectedStr },
      };
    },
  },
  editForm: {
    open: function (selectedStr, type, top, right) {
      return {
        type: "SELECT_TOOLS_OPEN",
        data: { type, top, right, selectedStr },
      };
    },
  },
};

let reducers = combineReducers({
  selectTools: function (state = null, action) {
    switch (action.type) {
      case "SELECT_TOOLS_OPEN":
        let { top, right, selectedStr, type } = action.data;
        return { tool: { type, top, right, selectedStr } };
      case "SELECT_TOOLS_CLOSE":
        return { tool: null };
      case "SELECT_TOOLS_TOGGLE": {
        if (state.tool === null) {
          let { top, right, type, selectedStr } = action.data;
          return { top, right, type, selectedStr };
        } else {
          return null;
        }
      }
      default:
        return state;
    }
  },
});

let Elements = {
  SelectToolsHolder: {
    create: function () {
      let selectionEl = document.createElement("div");
      selectionEl.style.position = "absolute";
      return selectionEl;
    },
    registerEventListeners: function (el) {
      // noop for select tools holder;
    },
  },
  EditForm: {
    create: function (selectedStr) {
      let el = document.createElement("form");
      el.id = "edit-form";
      el.innerHTML = `<textarea>${selectedStr}</textarea><button type="submit">Submit</button>`;
      return el;
    },
    registerEventListeners: function (el, selectedStr) {
      let editFormTextArea = el.querySelector("textarea");
      editFormTextArea.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      el.addEventListener("submit", function (e) {
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
    },
  },
  SuggestEdit: {
    create: function (selectedStr) {
      let styles =
        "border: none; border-radius: 4px; cursor: pointer; padding: 1rem; font-size: 1rem; font-family: inherit;";
      let el = document.createElement("div");
      el.id = "suggest-edit";
      el.innerHTML = `<button style="${styles}">Suggest edit</button>`;
      return el;
    },
    registerEventListeners: function (el, selectedStr, top, right) {
      el.querySelector("button").addEventListener("click", function () {
        store.dispatch(
          actions.editForm.open(selectedStr, "EditForm", top, right)
        );
      });
    },
  },
};

let previousState = initialState;
function render(store, selectToolsHolder) {
  let now = store.getState();
  let { selectTools: selectToolsNow } = now;

  let { selectTools: selectToolsBefore } = previousState;

  // render logic
  console.log(selectToolsNow.tool);
  if (
    (selectToolsNow.tool !== null &&
      selectToolsBefore.tool !== null &&
      selectToolsNow.tool.type !== selectToolsBefore.tool.type) ||
    selectToolsNow.tool === null ||
    selectToolsBefore.tool == null
  ) {
    let { type, top, right, selectedStr } = selectToolsNow.tool;
    let el;
    switch (type) {
      case "SuggestEdit":
        el = Elements.SuggestEdit.create(selectedStr);
        Elements.SuggestEdit.registerEventListeners(
          el,
          selectedStr,
          top,
          right
        );
        selectToolsHolder.innerHTML = "";
        selectToolsHolder.appendChild(el);
        break;
      case "EditForm":
        el = Elements.EditForm.create(selectedStr);
        Elements.EditForm.registerEventListeners(el, selectedStr);
        selectToolsHolder.innerHTML = "";
        selectToolsHolder.appendChild(el);
        break;
      default:
        console.log(">>>", selectToolsNow);
    }
    selectToolsHolder.style.top = top;
    selectToolsHolder.style.right = right;
  } else {
    selectToolsHolder.innerHTML = "";
  }

  previousState = now;
}

let store = createStore(reducers, initialState);
function createSelectToolsHolder(document) {
  let selectionEl = Elements.SelectToolsHolder.create();
  Elements.SelectToolsHolder.registerEventListeners(selectionEl);
  document.body.appendChild(selectionEl);
  return selectionEl;
}

let selectToolsHolder = createSelectToolsHolder(document);
store.subscribe(() => render(store, selectToolsHolder));

document.addEventListener("selectionchange", (e) => {
  // console.log(document.getSelection().toString());
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);

  if (range.collapsed) {
    return;
  }

  let selectedStr = selection.toString();

  var selectionRect = range.getBoundingClientRect();
  var rootRect = document.body.parentNode.getBoundingClientRect();
  let top = selectionRect.bottom - rootRect.top + "px"; //this will place ele below the selection
  let right = -(selectionRect.right - rootRect.right) + "px"; //this will align the right edges together
  store.dispatch(
    actions.selectTools.open(selectedStr, "SuggestEdit", top, right)
  );
});
