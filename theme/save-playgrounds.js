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

// This code is based on https://github.com/google/comprehensive-rust/blob/main/theme/save-playgrounds.js
// Copyright (c) 2023 Google LLC
// SPDX-LICENSE: Apache-2.0

(function savePlaygrounds() {
  function setCodeToPlayground() {
    var codes = JSON.parse(
      localStorage.getItem(`${window.location.href}₹code`),
    );
    if (codes) {
      var i = 0;
      Array.from(document.querySelectorAll(".playground")).forEach(
        function (pre_block) {
          let code_block = pre_block.querySelector("code");
          let editor = window.ace.edit(code_block);
          editor.setValue(codes[i]);
          editor.clearSelection();
          i += 1;
        },
      );
    }
  }
  function getCodeFromPlayground() {
    var codes = [];
    Array.from(document.querySelectorAll(".playground")).forEach(
      function (pre_block) {
        let code_block = pre_block.querySelector("code");
        let editor = window.ace.edit(code_block);
        let code = editor.getValue();
        codes.push(code);
      },
    );
    localStorage.setItem(`${window.location.href}₹code`, JSON.stringify(codes));
  }
  setCodeToPlayground();
  addEventListener("pagehide", getCodeFromPlayground);
})();

function resetPlaygroundsClicked() {
  let keys = [];
  for (var i = 0, len = localStorage.length; i < len; i++) {
    if (localStorage.key(i).includes("₹code")) {
      keys.push(localStorage.key(i));
    }
  }
  for (let j = 0; j < keys.length; j++) {
    localStorage.removeItem(keys[j]);
  }
}
window.resetPlaygroundsClicked = resetPlaygroundsClicked;
