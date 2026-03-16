# BlueOS kernel book

This repository contains the source of "BlueOS kernel book".

## Requirements
Most parts of the BlueOS project are powered by Rust programming language, including this book.
Please read [rustup](https://rustup.rs/) to install native Rust toolchain to continue.

Then we are using [mdBook](https://github.com/rust-lang/mdBook) to build this book. `mdbook` can be installed via command
```bash
cargo install mdbook --version 0.4.51
```

## Build the book
To build the book, run
```bash
mdbook build -d book
```
To build a Chinese version of this book, please refer to [mdbook-i18n-helpers](https://github.com/google/mdbook-i18n-helpers)
first to install prerequisites. Then use command
```bash
MDBOOK_BOOK__LANGUAGE=zh mdbook build -d book/zh
```

The output will be in the `book` subdirectory. To check it out, open it in
your web browser.

_Firefox:_

```bash
$ firefox book/index.html                       # Linux
$ open -a "Firefox" book/index.html             # OS X
$ Start-Process "firefox.exe" .\book\index.html # Windows (PowerShell)
$ start firefox.exe .\book\index.html           # Windows (Cmd)
```

_Chrome:_

```bash
$ google-chrome book/index.html                 # Linux
$ open -a "Google Chrome" book/index.html       # OS X
$ Start-Process "chrome.exe" .\book\index.html  # Windows (PowerShell)
$ start chrome.exe .\book\index.html            # Windows (Cmd)
```
