var strstr = Process.getModuleByName("libc.so").getExportByName("strstr");

Interceptor.attach(strstr, {
    onEnter: function (args) {
        this.needle = args[1].readCString();
    },
    onLeave: function (retval) {
        if (this.needle === "frida" || this.needle === "xposed") {
            retval.replace(ptr(0));
        }
    }
});
