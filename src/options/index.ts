import OptionsSync from "webext-options-sync";

new OptionsSync({
    defaults: {
        personalToken: "",
    },
}).syncForm("#options-form");
