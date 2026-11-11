# Add third party crates

We manage third-party Rust dependencies with GNRT.
All crates are transformed into GN's `BUILD.gn` files via [gnrt](../../external/gnrt),
which was originally developed by the Chromium project.

Declare Rust dependencies in `external/rust/BUILD.gn` or another file listed in
`external/gnrt_config.toml`. GNRT uses Cargo and `external/rust/Cargo.lock` to
resolve crate versions, download source code, apply patches, and generate
`BUILD.gn` files and GN target mappings in `external/vendor/`. Git ignores this
directory. Run `gnrt sync --all` before generating kernel or application build
files with GN.

## Install GNRT and sync dependencies

Run these commands from the BlueKernel repository root, with Cargo, GN, Python,
the BlueOS toolchain, and Cargo's binary directory on `PATH`:

```sh
cargo install --path external/gnrt --locked --bin gnrt
gnrt sync --all
gnrt sync --all --check
```

Cargo installs GNRT to `~/.cargo/bin`.

After updating GNRT's source code, rerun the installation command and
`gnrt sync --all` before building BlueKernel.

Set `GNRT_CARGO_BIN` to select the Cargo executable GNRT uses to resolve
dependencies. Cargo must support the dependencies' manifests, including Rust
edition 2024. Use the same tools for sync and builds. GN checks their paths and
checksums.

Finish `gnrt sync` before building the kernel or applications. Do not run it
while a build is using the same checkout. `gnrt sync --all --check` verifies the
saved sync state offline; it does not compile crates.

## Add dependency in `//external/rust/BUILD.gn`

To add a new third party crate, for example [unwinding](https://crates.io/crates/unwinding), add following code in `//external/rust/BUILD.gn`

```gn
cargo_spec("unwinding") {
  package = "unwinding"
  version = "=0.2.4"
  default_features = false
  features = [ "unwinder" ]
}
```

Run `gnrt sync --all` to generate the GN rules under `//external/vendor/`.
Targets can depend on those rules, for example by adding `//external/rust:unwinding` to the `deps` field in `BUILD.gn`.

### Procedural macros

Declare a procedural macro crate in the same way as a regular dependency. For
example, `external/rust/BUILD.gn` declares `paste`:

```gn
cargo_spec("paste") {
  package = "paste"
  version = "=1.0.15"
  default_features = false
}
```

In the consuming target, put regular libraries in `deps` and procedural macros
in `proc_macro_deps`:

```gn
import("//build/templates/build_template.gni")

build_rust("example") {
  crate_type = "rlib"
  sources = [ "src/lib.rs" ]
  deps = [ "//external/rust:unwinding" ]
  proc_macro_deps = [ "//external/rust:paste" ]
}
```

GNRT selects a host build for `paste` and a target build for `unwinding`.
If a crate has a `build.rs`, GNRT also generates its host build and arranges
for the script to run before compiling the crate for the target.

### Board-specific features

Keep the declaration outside board-specific `if` blocks. Put the board selection
inside `features` so GNRT can collect the declaration for every board. For
example, `external/rust/BUILD.gn` declares both chip features for `esp-hal`:

```gn
cargo_spec("esp-hal") {
  package = "esp-hal"
  version = "=1.1.1"
  default_features = false
  features = [
    {
      condition = "board == \"esp32c6_devkitc_1\""
      values = [ "esp32c6" ]
    },
    {
      condition = "board == \"seeed_xiao_esp32c3\""
      values = [ "esp32c3" ]
    },
  ]
}
```

A consuming target depends on `//external/rust:esp-hal`. Its generated rules
enable `esp32c6` when building `esp32c6_devkitc_1`, or `esp32c3` when building
`seeed_xiao_esp32c3`.

When adding another declaration file, add its path to the existing
`collect.declaration_files` list in `external/gnrt_config.toml`. The current
declaration files are registered as follows:

```toml
[collect]
declaration_files = ["external/rust/BUILD.gn"]
```

## Source patches

Pin the crate version or Git revision before adding a patch. Use paths starting
with `//`, relative to the repository root, in `patches`. Configure patches for
transitive dependencies and custom license file paths in
`external/gnrt_config.toml`. Keep existing local changes and license notices,
and run the project's license compliance checks.

GNRT applies configured patches during sync and skips patches that are already
applied. When adding or updating patches, test them against unmodified upstream
source code and compare the patched files with `external/vendor/`.
`gnrt sync --all --check` verifies the saved sync state; it does not test patch
application on a clean source tree.
