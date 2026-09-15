Java.perform(function () {
    var RootDetectionActivity = Java.use("owasp.sat.agoat.RootDetectionActivity");

    RootDetectionActivity.isRooted.implementation = function () {
        console.log("[*] isRooted() interceptée — retour forcé à false");
        return false;
    };
});
