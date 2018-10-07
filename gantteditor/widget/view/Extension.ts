export function loadExtension(name: string, callback?: () => void) {
    var script = document.createElement('script');
    if (callback) {
        script.onload = callback;
    }
    script.src = "widgets/gantteditor/lib/" + name + ".js";
    document.getElementsByTagName('head')[0].appendChild(script);
}