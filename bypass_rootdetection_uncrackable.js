Java.perform(function(){
    let RootDetection = Java.use("sg.vantagepoint.util.RootDetection");
    RootDetection.checkRoot1.implementation = function(){
        console.log("[+] Bypassing the first Root Detection check")
        return false
    }
    RootDetection.checkRoot2.implementation = function(){
        console.log("[+] Bypassing the second Root Detection check")
        return false
    }
    RootDetection.checkRoot3.implementation = function(){
        console.log("[+] Bypassing the third Root Detection check")
        return false
    } 
})
