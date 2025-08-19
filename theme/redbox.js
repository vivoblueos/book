// Copyright (c) 2025 vivo Mobile Communication Co., Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This code is based on https://github.com/google/comprehensive-rust/blob/main/theme/redbox.js
// Copyright (c) 2023 Google LLC
// SPDX-LICENSE: Apache-2.0

(function redBoxButton() {
  // Create a new div element
  var newDiv = document.createElement("div");
  // Set the id attribute of the new div
  newDiv.id = "aspect-ratio-helper";
  // Create a nested div inside the new div
  var nestedDiv = document.createElement("div");
  // Append the nested div to the new div
  newDiv.appendChild(nestedDiv, newDiv.firstChild);
  // Get the parent element where you want to append the new div
  var parentElement = document.body; // Change this to your desired parent element
  // Append the new div to the parent element
  parentElement.insertBefore(newDiv, parentElement.firstChild);
  //Default hiding the redbox
  document.getElementById("aspect-ratio-helper").style.display = "none";
})();

//Create a function to button to perform on click action.
function redboxButtonClicked() {
  var hideShowButton = document.getElementById("redbox");
  if (document.getElementById("aspect-ratio-helper").style.display === "none") {
    document.getElementById("aspect-ratio-helper").style.display = "block";
    hideShowButton.innerHTML = "aspect-ratio box";
  } else {
    document.getElementById("aspect-ratio-helper").style.display = "none";
    hideShowButton.innerHTML = "aspect-ratio box";
  }
}
window.redboxButtonClicked = redboxButtonClicked;
