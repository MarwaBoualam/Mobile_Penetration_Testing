Java.perform(function () {
    var Callback = Java.use("owasp.sat.agoat.TrafficActivity$run$1");
    Callback.onFailure.implementation = function (call, e) {
        console.log("[*] onFailure interceptée : " + e.getMessage());
        this.onFailure(call, e);
    };
});
