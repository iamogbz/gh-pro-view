import OptionsSync from "webext-options-sync";

// Define defaults
new OptionsSync().define({
    defaults: {
        personalToken: "",
    },
    migrations: [],
});
