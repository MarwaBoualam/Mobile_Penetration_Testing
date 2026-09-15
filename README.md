# Android Mobile Pentest Toolkit — Frida Hooking Scripts

A collection of Frida scripts used for mobile security assessments on Android:
SSL/TLS certificate pinning bypass, root detection bypass, and native (JNI)
method hooking. Built during hands-on mobile reverse engineering practice
targeting intentionally vulnerable apps (AndroGoat, OWASP UnCrackable App)
and CTF-style APKs.

>  **Ethical use only.** These scripts are provided for educational and
> authorized testing purposes only — on applications you own, on public
> vulnerable labs (AndroGoat, UnCrackable App, etc.), or with explicit written
> authorization. Do not use against third-party applications without consent.

---

## What's inside

| Category | What it does |
|---|---|
|  **SSL/TLS pinning bypass** | Defeats certificate pinning implemented via OkHttp `CertificatePinner`, custom `TrustManager`, or statically linked TLS libraries (e.g. BoringSSL in Flutter apps) |
|  **Root detection bypass** | Forces root-check methods (custom checks, RootBeer-style logic) to return `false` |
|  **Native (JNI) hooking** | Intercepts native library exports (`.so`) to hide instrumentation artifacts or alter return values at the memory level |
|  **Debug / logging helpers** | Non-invasive hooks used to observe app behavior (e.g. network callbacks) while diagnosing why a bypass isn't working |

---

## Repository structure

```
.
├── root-detection-bypass/
│   ├── bypass_rootdetection_uncrackable.js   # Targets OWASP UnCrackable App
│   └── bypass_isrooted_androgoat.js          # Targets AndroGoat
│
├── ssl-pinning-bypass/
│   ├── okhttp-trustmanager/                  # Java-layer hooks (OkHttp, TrustManager)
│   └── flutter/
│       └── flutter_ssl_bypass_boringssl.js   # Native memory-scan bypass for Flutter apps
│
├── native-hooking/
│   └── hide_frida_strstr_libc.js             # Hooks libc strstr() to hide "frida"/"xposed" strings
│
└── debug-logging/
    └── log_onfailure_traffic.js              # Logs network failure callbacks without altering behavior
```

---

## Script reference

### Root detection bypass

| Script | Target | Technique |
|---|---|---|
| `bypass_rootdetection_uncrackable.js` | `sg.vantagepoint.util.RootDetection` (OWASP UnCrackable App) | Overrides `checkRoot1()`, `checkRoot2()`, `checkRoot3()` to return `false` |
| `bypass_isrooted_androgoat.js` | `owasp.sat.agoat.RootDetectionActivity.isRooted()` (AndroGoat) | Overrides `isRooted()` to return `false` |

### SSL/TLS pinning bypass

| Script | Target | Technique |
|---|---|---|
| `flutter_ssl_bypass_boringssl.js` | `libflutter.so` (BoringSSL, statically linked) | Scans process memory for a byte pattern to locate `ssl_crypto_x509_session_verify_cert_chain`, hooks it via `Interceptor.attach`, and forces the return value from failure (`0`) to success (`1`). Hooks `android_dlopen_ext` to re-scan once the library is loaded, since Flutter loads it dynamically. |

> **Note:** the byte pattern used to locate the verification function is
> version-specific to Flutter/BoringSSL and may break across app builds.
> Re-verify the pattern with a disassembler (Ghidra/IDA) if the hook silently
> fails to install.

### Native (JNI) hooking

| Script | Target | Technique |
|---|---|---|
| `hide_frida_strstr_libc.js` | `strstr()` in `libc.so` | Intercepts all calls to `strstr`, inspects the searched substring, and returns `NULL` when the app searches for `"frida"` or `"xposed"` — a common technique used by anti-instrumentation checks scanning `/proc/self/maps` or loaded library names. |

> **Note:** this hook is global — it intercepts every `strstr()` call in the
> process, not just detection-related ones. Low risk, but worth knowing if
> the app legitimately searches for similar substrings elsewhere.

### Debug / logging

| Script | Target | Technique |
|---|---|---|
| `log_onfailure_traffic.js` | `TrafficActivity$run$1.onFailure()` (AndroGoat) | Logs network failure callbacks (e.g. TLS handshake errors) without modifying behavior — useful to confirm whether a pinning bypass actually took effect before a request. |

---

## Usage

Each script is run with Frida against a spawned or attached process:

```bash
frida -U -l <script.js> -f <package.name> --no-pause
```

Requirements:
- `frida-tools` and `frida` (client) installed on the host — `pip install frida-tools frida`
- `frida-server` matching the client version, pushed and running on the (rooted/emulated) target device
- Target APK installed on the device/emulator

Example:
```bash
frida -U -l root-detection-bypass/bypass_isrooted_androgoat.js -f owasp.sat.agoat --no-pause
```

---

## Methodology reference

Testing generally follows this order:
1. **Static analysis** — decompile with JADX/apktool, inspect the manifest, locate the relevant classes/native libraries, automated scan via MobSF
2. **Dynamic analysis** — attach Frida/Objection, apply the targeted hook, confirm the bypass with `adb logcat` and/or an intercepting proxy (Burp)

Generic tools (Objection's `android root disable` / `sslpinning disable`, or community scripts like `frida-multiple-unpinning.js`) are tried first; the scripts in this repo are the targeted, app-specific hooks written after static analysis when the generic approach isn't enough.

---

## License

MIT — see [LICENSE](LICENSE). Provided as-is, for authorized security testing and educational purposes.
