// flutterhooker.js — Frida 17.17.0
// Bypass SSL pinning Flutter (BoringSSL) — libflutter.so x86_64
// Cible : ssl_crypto_x509_session_verify_cert_chain

var PATTERN = "55 41 57 41 56 41 55 41 54 53 48 83 EC 38 C6 02 50";

function installHook(addr) {
    Interceptor.attach(addr, {
        onLeave: function (retval) {
            if (retval.toInt32() === 0) {
                console.log("[!] cert verification bypassée (0 -> 1) @ " + addr);
                retval.replace(0x1);
            }
        }
    });
    console.log("[+] Hook installé @ " + addr);
}

function scanAndHook() {
    var m = Process.findModuleByName("libflutter.so");
    if (!m) {
        console.log("[-] libflutter.so pas encore chargée");
        return false;
    }
    console.log("[+] libflutter.so @ " + m.base + " (taille " + m.size + ")");

    var results = Memory.scanSync(m.base, m.size, PATTERN);
    if (results.length === 0) {
        console.log("[-] Pattern introuvable — version Flutter différente ?");
        return false;
    }
    console.log("[+] " + results.length + " match(s) trouvé(s)");
    results.forEach(function (r) {
        installHook(r.address);
    });
    return true;
}

// --- Frida 17 : nouvelle API pour trouver dlopen ---
var dlopen = Module.getGlobalExportByName("android_dlopen_ext");
if (dlopen) {
    Interceptor.attach(dlopen, {
        onEnter: function (args) {
            try { this.path = args[0].readCString(); } catch (e) { this.path = null; }
        },
        onLeave: function () {
            if (this.path && this.path.indexOf("libflutter.so") !== -1) {
                setTimeout(scanAndHook, 0);
            }
        }
    });
    console.log("[*] Hook dlopen installé, attente de libflutter.so...");
}

// Au cas où libflutter est déjà chargée au moment de l'injection
scanAndHook();
