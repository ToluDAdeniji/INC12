const form = document.querySelector("#regForm");
const sections = Array.from(form.querySelectorAll(".step"));
const fields = Array.from(form.querySelectorAll("input, select, textarea"));
const summary = document.querySelector("#error-summary");
const status = document.querySelector("#projectStatus");
let currentStep = 0;

fields.forEach(function (field) {
  if (!field.id) field.id = "field-" + fields.indexOf(field);
  let error = document.getElementById(field.id + "_err");
  if (!error) {
    error = document.createElement("p");
    error.id = field.id + "_err";
    error.className = "field-error";
    field.insertAdjacentElement("afterend", error);
  }
  const describedBy = new Set((field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
  describedBy.add(error.id);
  field.setAttribute("aria-describedby", Array.from(describedBy).join(" "));
  error.setAttribute("aria-live", "polite");
});

function customMessage(field) {
  // TODO: return a message for each failed custom rule; return "" when valid.
  // fullname: reject whitespace-only / punctuation-only names.
  if (field.id == "fullname") {
    var name = field.value;
    if (name === "") {
        return "Enter Full Name";
    }else if (!/[A-Za-z]/.test(name)) {
        return "Enter atleast one letter"
    }else if (!/^[A-Za-z '-]+$/.test(name)) {
        return "Only A–Z/a–z letters, ordinary spaces, hyphens, and apostrophes"
    }
  }
  // campusEmail: require exactly the domain student.gsu.edu after @.
  if (field.id === "campusEmail") {
    var email = field.value;
    if (email === "") {
        return "Enter Email"
    }
    else if (/^\S+@student\.gsu\.edu$/i.test(email) === false) { 
        return "Email is in the incorrect format";
    }
    }
  // password: 8+ characters, upper, lower, digit, and a non-whitespace symbol.

  if (field.id == "password") {
    var password = field.value;
    if (password === "") {
        return "Enter password";
    }
    else if (password.length < 8) {
      return "Password needs to be at least 8 characters";
    } else if (/[A-Z]/.test(password) === false) {
      return "Password must contain atleast 1 uppercase letter";
    } else if (/[a-z]/.test(password) === false) {
      return "Password must contain atleast 1 lowercase letter";
    } else if (/\d/.test(password) === false) {
      return "Password must contain atleast 1 digit";
    } else if (/[^A-Za-z0-9\s]/.test(password) === false) {
      return "Password must contain atleast 1 symbol";
    }
  }
  // confirm: compare against password.value without trimming either password.
  if (field.id === "confirm") {
    var password = document.querySelector("#password").value;
    if (field.value === "") {
      return "Enter confirmation password";
    } else if (field.value !== password) {
      return "Passwords don't match";
    }
  }
  // interests: selectedOptions.length must be 1-3.
  if (field.id === "interests") {
    var length = field.selectedOptions.length;
    if (!(length <= 3 && length >= 1)) {
        return "You must select between 1 and 3 options";
    }
}
  // bio: explicitly reject value.length > 140, including programmatically set values.
  if (field.id === "bio") {
    var length = field.value.length;
    if (length > 140) {
        return "Keep bio under 140 characters";
    }
  }

  return "";
}

function checkField(field) {
  field.setCustomValidity("");
  field.setCustomValidity(customMessage(field));
  const valid = field.checkValidity();
  document.getElementById(field.id + "_err").textContent = valid ? "" : field.validationMessage;
  field.setAttribute("aria-invalid", String(!valid));
  return valid;
}

function showStep(index) {
  currentStep = index;
  sections.forEach(function (section, i) { section.classList.toggle("active", i === index); });
  document.querySelector("#stepNum").textContent = index + 1;
  summary.hidden = true;
  sections[index].querySelector("h2").focus();
}

function showErrors(invalid) {
  summary.replaceChildren();
  const heading = document.createElement("h2");
  heading.textContent = "Please correct these fields";
  const list = document.createElement("ul");
  invalid.forEach(function (field) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#" + field.id;
    link.textContent = field.name + ": " + field.validationMessage;
    link.addEventListener("click", function (event) {
      event.preventDefault();
      showStep(sections.indexOf(field.closest(".step")));
      field.focus();
    });
    item.appendChild(link);
    list.appendChild(item);
  });
  summary.append(heading, list);
  summary.hidden = false;
  summary.focus();
}

function buildReview() {
  const review = document.querySelector("#reviewSummary");
  review.replaceChildren();
  // TODO: add a safe summary of each non-secret value using textContent.
  var list = [
    ["Identity", "Name: " + document.querySelector("#fullname").value + " , Email: " + document.querySelector("#campusEmail").value + " , ID: " + document.querySelector("#studentId").value],
    ["Security", "Password: [Set]"],
    ["Profile", "tier: " + document.querySelector("input[name='tier']:checked").value + " , bio: " + (document.querySelector("#bio").value || "none")]
  ];

  for (var i = 0; i < list.length; i++) {
    var p = document.createElement("p");
    p.textContent = list[i][0] + " ::: " + list[i][1];
    review.appendChild(p);
  }

  ["Identity", "Security", "Profile"].forEach(function (title, index) {
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit " + title;
    edit.addEventListener("click", function () { showStep(index); });
    review.appendChild(edit);
  });
}

form.addEventListener("click", function (event) {
  if (event.target.closest("[data-back]")) showStep(Math.max(0, currentStep - 1));
  if (event.target.closest("[data-next]")) {
    const invalid = fields.filter(function (field) {
      return sections[currentStep].contains(field) && !checkField(field);
    });
    if (invalid.length) { showErrors(invalid); return; }
    if (currentStep === 2) buildReview();
    showStep(Math.min(3, currentStep + 1));
  }
});

fields.forEach(function (field) {
  field.addEventListener("blur", function () { checkField(field); });
  field.addEventListener("input", function () {
    status.textContent = "";
    if (field.getAttribute("aria-invalid") === "true") checkField(field);
    // TODO: recheck confirmation if password changes after confirmation was entered.
    var password = document.querySelector("#password");
    var confirmation = document.querySelector("#confirm");
      if (field === password && confirmation.value) {
        checkField(confirmation);
      }
  });
});
document.querySelector("#bio").addEventListener("input", function (event) {
  document.querySelector("#bioCount").textContent = 140 - event.target.value.length;
});
// TODO: update each #pwRules item on password input; show "Met" / "Needed" text.

document.querySelector("#password").addEventListener("input", function (event) {
  var myPass = event.target.value;
  var ruleList = document.querySelectorAll("#pwRules li");

  for (var i = 0; i < ruleList.length; i++) {
    var currentLi = ruleList[i];
    var ruleName = currentLi.getAttribute("data-rule");
    var passes = false;

    if (ruleName === "len") {
      if (myPass.length >= 8) {
        passes = true;
      }
    } else if (ruleName === "upper") {
      if (/[A-Z]/.test(myPass)) {
        passes = true;
      }
    } else if (ruleName === "lower") {
      if (/[a-z]/.test(myPass)) {
        passes = true;
      }
    } else if (ruleName === "digit") {
      if (/\d/.test(myPass)) {
        passes = true;
      }
    } else if (ruleName === "symbol") {
      if (/[^A-Za-z0-9\s]/.test(myPass)) {
        passes = true;
      }
    }

    if (passes) {
      currentLi.className = "met";
      if (currentLi.textContent.indexOf("Met: ") === -1) {
        currentLi.textContent = "Met: " + currentLi.textContent.replace("Needed: ", "");
      }
    } else {
      currentLi.className = "needed";
      if (currentLi.textContent.indexOf("Needed: ") === -1) {
        currentLi.textContent = "Needed: " + currentLi.textContent.replace("Met: ", "");
      }
    }
  }
});

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const invalid = fields.filter(function (field) { return !checkField(field); });
  if (invalid.length) { showErrors(invalid); return; }
  buildReview();
  showStep(3);
  status.textContent = "Implemented checks passed. Nothing sent. Complete all TODOs before submitting this project.";
});
showStep(0);