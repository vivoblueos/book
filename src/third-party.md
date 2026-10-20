# Add third party crates

We manage all third party crates in the https://github.com/vivoblueos/external repository.
All crates are transformed into GN's `BUILD.gn` files via [gnrt](https://chromium.googlesource.com/chromium/src/+/HEAD/tools/crates/gnrt/) which is initially created by the Chromium project.

## Add dependency in `//external/Cargo.toml`
To add a new third party crate, for example [unwinding](https://crates.io/crates/unwinding), add following code in `//external/Cargo.toml`
```
[dependencies.unwinding]
version = "=0.2.4"
default-features = false
features = [
    "unwinder"
]
```
The generated GN rules are checked in under `//external/vendor/`.
Targets can depend on those rules, for example by adding `//external/vendor/unwinding-0.2.4:unwinding` to the `deps` field in `BUILD.gn`.
