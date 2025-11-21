# Build kernel image

Before building the kernel image, please confirm the toolchain is built from BlueKernel's source tree.
```
rustc --print target-list | grep blueos
aarch64-vivo-blueos-newlib
riscv32-vivo-blueos
riscv32imc-vivo-blueos
riscv64-vivo-blueos
thumbv7m-vivo-blueos-newlibeabi
thumbv8m.main-vivo-blueos-newlibeabihf
```
```
cargo -Vv
cargo 1.84.0-dev (66221abde 2024-11-19)
release: 1.84.0-dev
commit-hash: 66221abdeca2002d318fde6efff516aab091df0e
commit-date: 2024-11-19
```

The kernel currently supports multiple boards.

- qemu_mps2_an385
- qemu_mps3_an547
- qemu_virt64_aarch64
- qemu_riscv64

To build a kernel image for specified board, like `qemu_mps2_an385`, use command
```
gn gen out/qemu_mps2_an385.release/ --args='build_type="release" board="qemu_mps2_an385"'
ninja -C out/qemu_mps2_an385.release
```
To run tests, type
```
ninja -C out/qemu_mps2_an385.release check_all
```

## Args and their semantics.
| arg        | semantics |
| ---        | ---       |
| build_type | Configuration for the build |
| board      | Name of the board targeted to |
